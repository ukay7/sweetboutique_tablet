import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle, CakeSlice, Check, ChevronLeft, ChevronRight, ClipboardList, Croissant,
    LoaderCircle, Minus, Plus, Search, ShoppingBag, Sparkles, Star, Trash2, Wheat,
} from 'lucide-react';
import { api } from '../lib/api';
import type { CartItem, CatalogData, Category, Product, ProductVariant } from '../types';
import AdvancedFinder from './AdvancedFinder';
import Modal from './Modal';

type Props = { catalog: CatalogData };
type InquiryForm = { customer_name: string; phone: string; email: string; event_date: string; event_type: string; fulfilment: 'pickup' | 'delivery'; address: string; customer_notes: string };

const iconMap = { cake: CakeSlice, sparkles: Sparkles, croissant: Croissant, wheat: Wheat, dessert: Star };
const money = (value: string | number) => `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value))} CAD`;

export default function Storefront({ catalog }: Props) {
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [serverProducts, setServerProducts] = useState(catalog.products);
    const [pagination, setPagination] = useState(catalog.pagination);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selected, setSelected] = useState<Product | null>(null);
    const [variantId, setVariantId] = useState<number | null>(null);
    const [productNotes, setProductNotes] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [inquiryOpen, setInquiryOpen] = useState(false);
    const [finderMode, setFinderMode] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const [toast, setToast] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reference, setReference] = useState('');
    const [inquiryError, setInquiryError] = useState('');
    const [form, setForm] = useState<InquiryForm>({ customer_name: '', phone: '', email: '', event_date: '', event_type: '', fulfilment: 'pickup', address: '', customer_notes: '' });
    const [custom, setCustom] = useState({ event_type: '', event_date: '', guests: '', flavours: '', style: '', colours: '', budget: '', dietary: '', notes: '' });
    const categoryRail = useRef<HTMLElement>(null);
    const subcategoryRail = useRef<HTMLElement>(null);

    const allSubcategories = useMemo(() => catalog.categories.flatMap((category) => category.subcategories), [catalog.categories]);
    const subcategories = useMemo(() => activeCategory ? catalog.categories.find((category) => category.id === activeCategory)?.subcategories || [] : allSubcategories, [activeCategory, allSubcategories, catalog.categories]);
    const products = serverProducts;
    const cartTotal = cart.reduce((total, item) => total + Number(item.variant?.price || item.product?.base_price || 0) * item.quantity, 0);

    const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
    const openProduct = (product: Product) => { setSelected(product); setVariantId(product.variants[0]?.id || null); setProductNotes(''); };
    const chooseCategory = (id: number | null) => { setActiveCategory(id); setActiveSubcategory(null); };
    const chooseSubcategory = (id: number | null) => {
        setActiveSubcategory(id);
        if (id && !activeCategory) {
            const owner = catalog.categories.find((category) => category.subcategories.some((subcategory) => subcategory.id === id));
            if (owner) setActiveCategory(owner.id);
        }
    };
    const moveRail = (rail: React.RefObject<HTMLElement | null>, direction: -1 | 1) => rail.current?.scrollBy({ left: direction * Math.min(520, rail.current.clientWidth * .72), behavior: 'smooth' });

    const catalogUrl = (page: number) => {
        const params = new URLSearchParams({ page: String(page), per_page: '12' });
        if (query.trim()) params.set('q', query.trim());
        if (activeCategory) params.set('category_id', String(activeCategory));
        if (activeSubcategory) params.set('subcategory_id', String(activeSubcategory));
        return `/api/catalog?${params.toString()}`;
    };

    useEffect(() => {
        if (finderMode) return;
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoadingProducts(true);
            try {
                const response = await api<CatalogData>(catalogUrl(1));
                if (!cancelled) { setServerProducts(response.products); setPagination(response.pagination); }
            } finally { if (!cancelled) setLoadingProducts(false); }
        }, query ? 260 : 0);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [activeCategory, activeSubcategory, finderMode, query]);

    const loadMore = async () => {
        if (loadingProducts || !pagination.has_more) return;
        setLoadingProducts(true);
        try {
            const response = await api<CatalogData>(catalogUrl(pagination.current_page + 1));
            setServerProducts((current) => [...current, ...response.products]);
            setPagination(response.pagination);
        } finally { setLoadingProducts(false); }
    };

    const addProduct = (product: Product, variant?: ProductVariant) => {
        const key = `${product.id}-${variant?.id || 'base'}`;
        setCart((current) => {
            const existing = current.find((item) => item.key === key);
            return existing
                ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1, notes: productNotes || item.notes } : item)
                : [...current, { key, product, variant, quantity: 1, notes: productNotes }];
        });
        setSelected(null);
        showToast(`${product.name} added to your inquiry`);
    };

    const addCustomRequest = (event: FormEvent) => {
        event.preventDefault();
        setCart((current) => [...current, { key: `custom-${Date.now()}`, quantity: 1, notes: custom.notes, customDetails: custom }]);
        setCustomOpen(false);
        showToast('Custom cake brief added');
    };

    const updateQuantity = (key: string, change: number) => setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, item.quantity + change) } : item));

    const submitInquiry = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true); setInquiryError('');
        try {
            const response = await api<{ inquiry: { reference: string } }>('/api/inquiries', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    event_date: form.event_date || null,
                    email: form.email || null,
                    address: form.address || null,
                    items: cart.map((item) => ({ product_id: item.product?.id || null, variant_id: item.variant?.id || null, quantity: item.quantity, notes: item.notes || null, custom_details: item.customDetails || null })),
                }),
            });
            setReference(response.inquiry.reference);
            setCart([]);
        } catch (reason) { setInquiryError(reason instanceof Error ? reason.message : 'We could not send the inquiry.'); }
        finally { setSubmitting(false); }
    };

    return (
        <main className="store-shell app-surface">
            <header className={`topbar ${finderMode ? 'finder-context' : ''}`}>
                <button className="brand brand-button" onClick={() => { chooseCategory(null); setQuery(''); setFinderMode(false); }} aria-label="Sweet Boutique home">
                    <span className="brand-mark">SB</span><span><strong>Sweet Boutique</strong><small>Pasticceria & bakery</small></span>
                </button>
                {!finderMode && <label className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cakes, flavours, pastries…" /><kbd>⌘ K</kbd></label>}
                <div className="topbar-actions">
                    <button className="cart-button" onClick={() => { setReference(''); setInquiryOpen(true); }}><ShoppingBag size={19} /><span>Inquiry</span><b>{cart.reduce((sum, item) => sum + item.quantity, 0)}</b></button>
                </div>
            </header>

            <div className={`store-viewport ${finderMode ? 'finder-active' : ''}`}>
                {finderMode ? <AdvancedFinder catalog={catalog} onBack={() => setFinderMode(false)} onOpenProduct={openProduct} onAddProduct={(product) => addProduct(product, product.variants[0])} /> : <>
                <section className="welcome-strip">
                    <div><span className="eyebrow">Made for your moment</span><h1>Find something worth celebrating.</h1></div>
                    <div className="welcome-actions">
                        <button className="finder-button" onClick={() => setFinderMode(true)}><Sparkles size={20} /><span><b>Need a little help?</b><small>Open Advanced Cake Finder</small></span><ChevronRight size={20} /></button>
                        <button className="custom-cake-button" onClick={() => setCustomOpen(true)}><CakeSlice size={20} /><span><b>Dreaming bigger?</b><small>Build a custom cake brief</small></span></button>
                    </div>
                </section>

                <div className="rail-shell category-shell"><button className="rail-arrow previous" onClick={() => moveRail(categoryRail, -1)} aria-label="Previous categories"><ChevronLeft size={18} /></button><nav ref={categoryRail} className="category-rail" aria-label="Product categories">
                    <button className={!activeCategory ? 'category-pill active' : 'category-pill'} onClick={() => chooseCategory(null)}><Sparkles size={18} />All bakes</button>
                    {catalog.categories.map((category) => {
                        const Icon = iconMap[category.icon as keyof typeof iconMap] || CakeSlice;
                        return <button key={category.id} className={activeCategory === category.id ? 'category-pill active' : 'category-pill'} onClick={() => chooseCategory(category.id)}><Icon size={18} />{category.name}</button>;
                    })}
                </nav><button className="rail-arrow next" onClick={() => moveRail(categoryRail, 1)} aria-label="More categories"><ChevronRight size={18} /></button></div>

                {subcategories.length > 0 && <div className="rail-shell subcategory-shell"><button className="rail-arrow previous" onClick={() => moveRail(subcategoryRail, -1)} aria-label="Previous subcategories"><ChevronLeft size={17} /></button><nav ref={subcategoryRail} className="subcategory-rail" aria-label="Product subcategories"><span className="rail-label">Subcategories</span><button className={!activeSubcategory ? 'active' : ''} onClick={() => chooseSubcategory(null)}>All collections</button>{subcategories.map((subcategory) => <button className={activeSubcategory === subcategory.id ? 'active' : ''} key={subcategory.id} onClick={() => chooseSubcategory(subcategory.id)}>{subcategory.name}</button>)}</nav><button className="rail-arrow next" onClick={() => moveRail(subcategoryRail, 1)} aria-label="More subcategories"><ChevronRight size={17} /></button></div>}

                <section className="catalogue-heading"><div><p className="section-kicker">Today’s collection</p><h2>{activeSubcategory ? allSubcategories.find((item) => item.id === activeSubcategory)?.name : activeCategory ? catalog.categories.find((item) => item.id === activeCategory)?.name : 'All bakes'}</h2></div><div className="result-meta"><span>{pagination.total} creations</span><button onClick={() => setFinderMode(true)}>Advanced filters <ChevronRight size={16} /></button></div></section>

                <section className="product-grid" aria-live="polite">
                    {products.map((product) => (
                        <article className="product-card" key={product.id}>
                            <button className={`product-image ${product.image_slot}`} style={product.image_url ? { backgroundImage: `url(${product.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} onClick={() => openProduct(product)} aria-label={`View ${product.name}`}>
                                {product.badges[0] && <span className={`product-badge ${product.badges[0].tone || ''}`}>{product.badges[0].name}</span>}
                            </button>
                            <div className="product-copy"><span>{product.category?.name}</span><button className="product-title" onClick={() => openProduct(product)}><h3>{product.name}</h3></button><p>{product.short_description}</p><div className="product-footer"><strong>From {money(product.base_price)}</strong><button onClick={() => addProduct(product, product.variants[0])}><ShoppingBag size={17} /> Add</button></div></div>
                        </article>
                    ))}
                    {products.length === 0 && <div className="empty-state"><Search size={24} /><b>No delicious matches yet</b><span>Try another flavour or category.</span></div>}
                </section></>}
                {!finderMode && pagination.has_more && <div className="catalogue-pagination"><button onClick={loadMore} disabled={loadingProducts}>{loadingProducts ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />}{loadingProducts ? 'Loading creations…' : `Load 12 more · ${products.length} of ${pagination.total}`}</button></div>}
            </div>

            <Modal open={!!selected} onClose={() => setSelected(null)} className="product-modal">
                {selected && <div className="product-detail-layout">
                    <div className={`detail-image ${selected.image_slot}`} style={selected.image_url ? { backgroundImage: `url(${selected.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><span>{selected.badges[0]?.name || 'Made fresh'}</span></div>
                    <div className="detail-copy"><span className="eyebrow">{selected.category?.name}</span><h2>{selected.name}</h2><p className="lead">{selected.description}</p><div className="detail-meta"><div><span>Starting from</span><b>{money(selected.base_price)}</b></div><div><span>Preparation</span><b>48 hours</b></div></div>
                        <fieldset className="variant-list"><legend>Choose a size</legend>{selected.variants.map((variant) => <button type="button" key={variant.id} className={variantId === variant.id ? 'active' : ''} onClick={() => setVariantId(variant.id)}><span><b>{variant.name}</b><small>{variant.serves || 'Bakery selection'}</small></span><strong>{money(variant.price)}</strong></button>)}</fieldset>
                        {selected.allergens.length > 0 && <div className="allergen-note"><AlertTriangle size={19} /><span><b>Allergen guidance</b><small>Contains {selected.allergens.map((item) => item.name).join(', ')}. Please confirm sensitivities with our team.</small></span></div>}
                        <label className="field-label">Notes for the pastry team<textarea value={productNotes} onChange={(event) => setProductNotes(event.target.value)} placeholder="Message on cake, pickup time, decoration…" /></label>
                        <button className="primary-button full-button" onClick={() => addProduct(selected, selected.variants.find((variant) => variant.id === variantId))}><ShoppingBag size={18} /> Add to inquiry · {money(selected.variants.find((variant) => variant.id === variantId)?.price || selected.base_price)}</button>
                    </div>
                </div>}
            </Modal>

            <Modal open={customOpen} onClose={() => setCustomOpen(false)} title="Create a cake brief" eyebrow="Made just for you" className="form-modal">
                <form className="custom-form" onSubmit={addCustomRequest}><div className="form-grid"><label>Event type<input required value={custom.event_type} onChange={(e) => setCustom({ ...custom, event_type: e.target.value })} placeholder="Birthday, wedding…" /></label><label>Event date<input type="date" required value={custom.event_date} onChange={(e) => setCustom({ ...custom, event_date: e.target.value })} /></label><label>Guest count<input required value={custom.guests} onChange={(e) => setCustom({ ...custom, guests: e.target.value })} placeholder="e.g. 24" /></label><label>Preferred flavours<input value={custom.flavours} onChange={(e) => setCustom({ ...custom, flavours: e.target.value })} placeholder="Chocolate, pistachio…" /></label><label>Cake style<input value={custom.style} onChange={(e) => setCustom({ ...custom, style: e.target.value })} placeholder="Minimal, floral, sculpted…" /></label><label>Theme & colours<input value={custom.colours} onChange={(e) => setCustom({ ...custom, colours: e.target.value })} placeholder="Ivory, sage, gold…" /></label><label>Budget range<input value={custom.budget} onChange={(e) => setCustom({ ...custom, budget: e.target.value })} placeholder="Rs. 8,000–12,000" /></label><label>Dietary concerns<input value={custom.dietary} onChange={(e) => setCustom({ ...custom, dietary: e.target.value })} placeholder="Nuts, gluten, dairy…" /></label></div><label>Inspiration notes<textarea value={custom.notes} onChange={(e) => setCustom({ ...custom, notes: e.target.value })} placeholder="Tell us about the look, message and feeling you have in mind…" /></label><div className="form-notice"><AlertTriangle size={18} />Custom cake pricing is confirmed after our pastry team reviews your brief.</div><button className="primary-button" type="submit"><Plus size={18} /> Add brief to inquiry</button></form>
            </Modal>

            <Modal open={inquiryOpen} onClose={() => setInquiryOpen(false)} title={reference ? 'Your inquiry is on its way' : 'Review your inquiry'} eyebrow={reference ? 'Thank you' : `${cart.length} selected item${cart.length === 1 ? '' : 's'}`} className="inquiry-modal">
                {reference ? <div className="success-state"><span className="success-icon"><Check size={30} /></span><h3>We’ll be in touch shortly.</h3><p>Our pastry team will confirm availability, final pricing and pickup or delivery details.</p><div className="reference-card"><span>Inquiry reference</span><b>{reference}</b></div><button className="primary-button" onClick={() => setInquiryOpen(false)}>Continue browsing</button></div>
                : cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={34} /><h3>Your inquiry is empty</h3><p>Add a few creations or start with a custom cake brief.</p><button className="primary-button" onClick={() => setInquiryOpen(false)}>Explore the collection</button></div>
                : <form className="inquiry-layout" onSubmit={submitInquiry}><div className="inquiry-items"><h3>Your selection</h3>{cart.map((item) => <div className="cart-row" key={item.key}><div className={`cart-thumb ${item.product?.image_slot || 'custom-thumb'}`}>{!item.product && <CakeSlice size={22} />}</div><div className="cart-copy"><b>{item.product?.name || 'Custom Cake Request'}</b><span>{item.variant?.name || item.customDetails?.event_type || 'Personal brief'}</span>{item.notes && <small>{item.notes}</small>}</div><div className="quantity-control"><button type="button" onClick={() => updateQuantity(item.key, -1)}><Minus size={14} /></button><b>{item.quantity}</b><button type="button" onClick={() => updateQuantity(item.key, 1)}><Plus size={14} /></button></div><strong>{item.product ? money(Number(item.variant?.price || item.product.base_price) * item.quantity) : 'Quote'}</strong><button type="button" className="remove-button" onClick={() => setCart((current) => current.filter((row) => row.key !== item.key))}><Trash2 size={16} /></button></div>)}<div className="estimated-total"><span>Estimated catalogue total<small>Custom work is quoted separately.</small></span><b>{money(cartTotal)}</b></div></div>
                    <div className="customer-form"><h3>Your details</h3><div className="form-grid"><label>Full name<input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></label><label>Phone<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx xxx xxxx" /></label><label>Email <small>optional</small><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Event date<input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></label><label>Event type<input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} /></label><label>Fulfilment<select value={form.fulfilment} onChange={(e) => setForm({ ...form, fulfilment: e.target.value as 'pickup' | 'delivery' })}><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></label>{form.fulfilment === 'delivery' && <label className="span-two">Delivery address<input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>}</div><label>Anything else?<textarea value={form.customer_notes} onChange={(e) => setForm({ ...form, customer_notes: e.target.value })} placeholder="Timing, gifting notes, dietary concerns…" /></label>{inquiryError && <div className="form-error">{inquiryError}</div>}<button className="primary-button full-button" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={18} /> : <ClipboardList size={18} />}{submitting ? 'Sending securely…' : 'Send inquiry'}</button><p className="submit-note">This is an inquiry, not a confirmed order. Final availability and pricing are confirmed by our team.</p></div></form>}
            </Modal>

            {toast && <div className="toast"><Check size={17} />{toast}</div>}
        </main>
    );
}

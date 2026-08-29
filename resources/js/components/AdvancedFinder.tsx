import { useEffect, useState } from 'react';
import {
    AlertTriangle, ArrowLeft, CakeSlice, Check, Layers3, LoaderCircle, RotateCcw, Search, ShoppingBag, Sparkles,
} from 'lucide-react';
import type { CatalogData, Product } from '../types';
import { api } from '../lib/api';
import SmartSelect from './SmartSelect';

type Props = {
    catalog: CatalogData;
    onBack: () => void;
    onOpenProduct: (product: Product) => void;
    onAddProduct: (product: Product) => void;
};

const budgets = [
    { label: 'Any budget', value: 'any' }, { label: 'Under $50 CAD', value: 'under-50' },
    { label: '$50–$100 CAD', value: '50-100' }, { label: '$100–$150 CAD', value: '100-150' },
    { label: '$150+ CAD', value: '150-plus' },
];
const money = (value: string | number) => `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value))} CAD`;

export default function AdvancedFinder({ catalog, onBack, onOpenProduct, onAddProduct }: Props) {
    const [occasionId, setOccasionId] = useState<number | null>(null);
    const [guests, setGuests] = useState('');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
    const [styleId, setStyleId] = useState<number | null>(null);
    const [loved, setLoved] = useState<number[]>([]);
    const [avoided, setAvoided] = useState<number[]>([]);
    const [excluded, setExcluded] = useState<number[]>([]);
    const [glutenFree, setGlutenFree] = useState(false);
    const [budget, setBudget] = useState('any');
    const [matches, setMatches] = useState<Product[]>(catalog.products);
    const [pagination, setPagination] = useState(catalog.pagination);
    const [loading, setLoading] = useState(false);

    const toggle = (value: number, values: number[], setValues: (next: number[]) => void) => setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    const subcategories = categoryId ? catalog.categories.find((category) => category.id === categoryId)?.subcategories || [] : catalog.categories.flatMap((category) => category.subcategories);
    const activeCount = [occasionId, guests, categoryId, subcategoryId, styleId, loved.length, avoided.length, excluded.length, glutenFree, budget !== 'any'].filter(Boolean).length;

    const finderUrl = (page: number) => {
        const params = new URLSearchParams({ page: String(page), per_page: '12' });
        if (categoryId) params.set('category_id', String(categoryId));
        if (subcategoryId) params.set('subcategory_id', String(subcategoryId));
        if (occasionId) params.set('occasion_id', String(occasionId));
        if (guests) params.set('guests', guests);
        if (styleId) params.set('style_id', String(styleId));
        if (loved.length) params.set('flavor_ids', loved.join(','));
        if (avoided.length) params.set('avoid_flavor_ids', avoided.join(','));
        if (excluded.length) params.set('allergen_ids', excluded.join(','));
        if (glutenFree) params.set('gluten_free', 'true');
        if (budget !== 'any') params.set('budget', budget);
        return `/api/catalog?${params.toString()}`;
    };

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            try {
                const data = await api<CatalogData>(finderUrl(1));
                if (!cancelled) { setMatches(data.products); setPagination(data.pagination); }
            } finally { if (!cancelled) setLoading(false); }
        }, 180);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [avoided, budget, categoryId, excluded, glutenFree, guests, loved, occasionId, styleId, subcategoryId]);

    const loadMore = async () => {
        if (loading || !pagination.has_more) return;
        setLoading(true);
        try {
            const data = await api<CatalogData>(finderUrl(pagination.current_page + 1));
            setMatches((current) => [...current, ...data.products]);
            setPagination(data.pagination);
        } finally { setLoading(false); }
    };

    const reset = () => {
        setOccasionId(null); setGuests(''); setCategoryId(null); setSubcategoryId(null); setStyleId(null);
        setLoved([]); setAvoided([]); setExcluded([]); setGlutenFree(false); setBudget('any');
    };

    return <section className="finder-page">
        <header className="finder-page-header compact">
            <button className="finder-back" onClick={onBack}><ArrowLeft size={17} /><span>Collection</span></button>
            <div className="finder-compact-title"><Sparkles size={18} /><span><b>Advanced Cake Finder</b><small>{pagination.total} matching creation{pagination.total === 1 ? '' : 's'}</small></span></div>
            <span className="live-match"><i />Live matching</span>
        </header>

        <div className="finder-workspace">
            <aside className="finder-sidebar" aria-label="Advanced cake filters">
                <FilterGroup label="What is the occasion?" count={occasionId ? 1 : 0}>
                    <div className="filter-chip-wrap">{catalog.occasions.map((item) => <Chip key={item.id} active={occasionId === item.id} onClick={() => setOccasionId(occasionId === item.id ? null : item.id)}>{item.name}</Chip>)}</div>
                </FilterGroup>

                <FilterGroup label="How many guests?" count={guests ? 1 : 0}>
                    <label className="finder-number"><span>Approx.</span><input inputMode="numeric" value={guests} onChange={(event) => setGuests(event.target.value.replace(/\D/g, ''))} placeholder="e.g. 24" /></label>
                </FilterGroup>

                <FilterGroup label="Category & collection" count={(categoryId ? 1 : 0) + (subcategoryId ? 1 : 0)}>
                    <SmartSelect icon={<CakeSlice size={17} />} value={categoryId} placeholder="All categories" searchPlaceholder="Search categories…" options={catalog.categories.map((category) => ({ value: category.id, label: category.name }))} onChange={(value) => { setCategoryId(value ? Number(value) : null); setSubcategoryId(null); }} />
                    <SmartSelect className="subcategory-select" icon={<Layers3 size={17} />} value={subcategoryId} placeholder="All subcategories" searchPlaceholder="Search subcategories…" options={subcategories.map((subcategory) => ({ value: subcategory.id, label: subcategory.name, group: catalog.categories.find((category) => category.id === subcategory.category_id)?.name }))} onChange={(value) => { const next = value ? Number(value) : null; setSubcategoryId(next); if (next && !categoryId) setCategoryId(catalog.categories.find((category) => category.subcategories.some((subcategory) => subcategory.id === next))?.id || null); }} />
                </FilterGroup>

                <FilterGroup label="Cake style" count={styleId ? 1 : 0}>
                    <div className="filter-chip-wrap"><Chip active={styleId === null} onClick={() => setStyleId(null)}>No preference</Chip>{catalog.styles.map((item) => <Chip key={item.id} active={styleId === item.id} onClick={() => setStyleId(styleId === item.id ? null : item.id)}>{item.name}</Chip>)}</div>
                </FilterGroup>

                <FilterGroup label="Flavours they love" count={loved.length}>
                    <div className="filter-chip-wrap">{catalog.flavors.map((item) => <Chip key={item.id} active={loved.includes(item.id)} onClick={() => toggle(item.id, loved, setLoved)}>{item.name}</Chip>)}</div>
                </FilterGroup>

                <FilterGroup label="Flavours to avoid" count={avoided.length}>
                    <div className="filter-chip-wrap">{catalog.flavors.map((item) => <Chip key={item.id} active={avoided.includes(item.id)} danger onClick={() => toggle(item.id, avoided, setAvoided)}>{item.name}</Chip>)}</div>
                </FilterGroup>

                <FilterGroup label="Exclusions & allergy concerns" count={excluded.length}>
                    <div className="filter-chip-wrap">{catalog.allergens.map((item) => <Chip key={item.id} active={excluded.includes(item.id)} danger onClick={() => toggle(item.id, excluded, setExcluded)}>{item.name}</Chip>)}</div>
                    <p className="filter-disclaimer"><AlertTriangle size={13} />These are customer preferences, not a verified allergen-safety guarantee.</p>
                </FilterGroup>

                <FilterGroup label="Prefer gluten-free items" count={glutenFree ? 1 : 0}>
                    <div className="filter-segment"><button className={!glutenFree ? 'active' : ''} onClick={() => setGlutenFree(false)}>No preference</button><button className={glutenFree ? 'active' : ''} onClick={() => setGlutenFree(true)}>Yes</button></div>
                </FilterGroup>

                <FilterGroup label="Budget range" count={budget !== 'any' ? 1 : 0}>
                    <div className="filter-chip-wrap">{budgets.map((item) => <Chip key={item.value} active={budget === item.value} onClick={() => setBudget(item.value)}>{item.label}</Chip>)}</div>
                </FilterGroup>

                <button className="finder-sidebar-reset" onClick={reset}><RotateCcw size={16} /><span>Clear all answers</span>{activeCount > 0 && <b>{activeCount}</b>}</button>
            </aside>

            <main className="finder-results">
                <div className="finder-results-head"><div><span className="section-kicker">Curated in real time</span><h2>{pagination.total} matching creation{pagination.total === 1 ? '' : 's'}</h2><p>{activeCount ? `${activeCount} preference${activeCount === 1 ? '' : 's'} shaping these results` : 'Start answering on the left to personalise this collection'}</p></div>{loading && <span className="finder-loading"><LoaderCircle className="spin" size={16} />Updating</span>}</div>
                {activeCount > 0 && <div className="active-filter-row">{occasionId && <span>{catalog.occasions.find((item) => item.id === occasionId)?.name}<button onClick={() => setOccasionId(null)}>×</button></span>}{guests && <span>Serves {guests}+<button onClick={() => setGuests('')}>×</button></span>}{styleId && <span>{catalog.styles.find((item) => item.id === styleId)?.name}<button onClick={() => setStyleId(null)}>×</button></span>}{loved.map((id) => <span key={id}>{catalog.flavors.find((item) => item.id === id)?.name}<button onClick={() => toggle(id, loved, setLoved)}>×</button></span>)}{avoided.map((id) => <span className="danger" key={`avoid-${id}`}>No {catalog.flavors.find((item) => item.id === id)?.name}<button onClick={() => toggle(id, avoided, setAvoided)}>×</button></span>)}{excluded.map((id) => <span className="danger" key={`allergen-${id}`}>No {catalog.allergens.find((item) => item.id === id)?.name}<button onClick={() => toggle(id, excluded, setExcluded)}>×</button></span>)}{budget !== 'any' && <span>{budgets.find((item) => item.value === budget)?.label}<button onClick={() => setBudget('any')}>×</button></span>}</div>}
                <div className="finder-product-grid">{matches.map((product, index) => <article className="finder-product-card" key={product.id}><button className={`finder-product-image ${product.image_slot}`} style={product.image_url ? { backgroundImage: `url(${product.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} onClick={() => onOpenProduct(product)}>{index === 0 && activeCount > 0 && <span className="best-match"><Sparkles size={13} />Best match</span>}<span className="match-score">{activeCount ? Math.max(78, 94 - index * 2) : 'Fresh'}</span></button><div><span>{product.category?.name}</span><button onClick={() => onOpenProduct(product)}><h3>{product.name}</h3></button><p>{product.short_description}</p><footer><strong>From {money(product.base_price)}</strong><button onClick={() => onAddProduct(product)}><ShoppingBag size={16} />Add</button></footer></div></article>)}{matches.length === 0 && !loading && <div className="finder-empty"><span><Search size={25} /></span><h3>No exact matches—yet.</h3><p>Relax one preference or reset the finder to bring more creations back.</p><button onClick={reset}><RotateCcw size={16} />Reset finder</button></div>}</div>
                {pagination.has_more && <div className="finder-pagination"><button onClick={loadMore} disabled={loading}>{loading ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}{loading ? 'Loading…' : `Load 12 more · ${matches.length} of ${pagination.total}`}</button></div>}
            </main>
        </div>
    </section>;
}

function FilterGroup({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
    return <fieldset className="finder-filter-group"><legend>{label}{count > 0 && <span>{count}</span>}</legend>{children}</fieldset>;
}

function Chip({ active, danger = false, onClick, children }: { active: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
    return <button type="button" className={`filter-chip ${active ? 'active' : ''} ${danger ? 'danger' : ''}`} onClick={onClick}>{active && <Check size={12} />}{children}</button>;
}

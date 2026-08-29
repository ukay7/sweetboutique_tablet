import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft, BarChart3, Boxes, CakeSlice, Check, ChevronRight, CircleDollarSign, ClipboardList,
    FolderTree, Inbox, LayoutDashboard, LoaderCircle, LogOut, Mail, MoreHorizontal, PackageCheck,
    Pencil, Phone, Plus, RefreshCw, Search, Settings, ShoppingBag, SlidersHorizontal, Sparkles, Trash2, UploadCloud,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { AdminData, AdminSettingsData, AdminUser, CatalogAttribute, Category, Inquiry, PaginationMeta, Product, Role, Subcategory } from '../types';
import AdminOverview from './AdminOverview';
import Modal from './Modal';
import SmartSelect from './SmartSelect';

type Props = { returnToStore: () => void; onCatalogChanged: () => Promise<void> };
type AdminTab = 'overview' | 'inquiries' | 'products' | 'categories' | 'attributes' | 'settings';
type SortState = { column: string; direction: 'asc' | 'desc' };
type ProductFormState = {
    category_id: number; subcategory_id: number | null; name: string; short_description: string; description: string;
    base_price: number; preparation_hours: number; image_slot: string; image_url: string; is_featured: boolean; is_active: boolean; sort_order: number;
    occasion_ids: number[]; style_ids: number[]; flavor_ids: number[]; allergen_ids: number[]; badge_ids: number[];
    variants: { name: string; price: number; serves: string; serves_min: number | null; serves_max: number | null; is_active: boolean }[];
};
type AttributeType = 'occasions' | 'styles' | 'flavors' | 'allergens' | 'badges';
const money = (value: string | number) => `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value))} CAD`;
const statusLabel = { new: 'New', contacted: 'Contacted', quoted: 'Quoted', confirmed: 'Confirmed', cancelled: 'Cancelled' };
const blankCategory = { name: '', description: '', icon: 'cake', sort_order: 0, is_active: true };
const blankProduct: ProductFormState = { category_id: 0, subcategory_id: null, name: '', short_description: '', description: '', base_price: 0, preparation_hours: 48, image_slot: 'sprite-1', image_url: '', is_featured: false, is_active: true, sort_order: 0, occasion_ids: [], style_ids: [], flavor_ids: [], allergen_ids: [], badge_ids: [], variants: [{ name: 'Classic', price: 0, serves: '8–10 guests', serves_min: 8, serves_max: 10, is_active: true }, { name: 'Grand', price: 0, serves: '14–16 guests', serves_min: 14, serves_max: 16, is_active: true }] };

export default function AdminPortal({ returnToStore, onCatalogChanged }: Props) {
    const [ready, setReady] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [login, setLogin] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [data, setData] = useState<AdminData | null>(null);
    const [tab, setTab] = useState<AdminTab>('overview');
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [categoryModal, setCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryForm, setCategoryForm] = useState(blankCategory);
    const [subName, setSubName] = useState('');
    const [productModal, setProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState(blankProduct);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [inquiryStatus, setInquiryStatus] = useState<Inquiry['status']>('new');
    const [internalNotes, setInternalNotes] = useState('');
    const [tableLoading, setTableLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [productSort, setProductSort] = useState<SortState>({ column: 'created_at', direction: 'desc' });
    const [inquirySort, setInquirySort] = useState<SortState>({ column: 'created_at', direction: 'desc' });
    const [attributeType, setAttributeType] = useState<AttributeType>('occasions');
    const [attributeName, setAttributeName] = useState('');
    const [settingsData, setSettingsData] = useState<AdminSettingsData | null>(null);
    const [newRole, setNewRole] = useState({ name: '', menu_items: ['overview', 'inquiries'] as string[] });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role_id: 0 });

    const loadDashboard = useCallback(async () => {
        setData(await api<AdminData>('/api/admin/dashboard'));
    }, []);
    const loadSettings = useCallback(async () => { setSettingsData(await api<AdminSettingsData>('/api/admin/settings')); }, []);

    const loadAdminList = useCallback(async (kind: 'products' | 'inquiries', page: number, search: string, append = false, sort?: SortState) => {
        setTableLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), q: search.trim() });
            if (sort) { params.set('sort', sort.column); params.set('direction', sort.direction); }
            if (kind === 'products') params.set('per_page', '24');
            else params.set('per_page', '25');
            if (kind === 'products') {
                const response = await api<{ products: Product[]; pagination: PaginationMeta }>(`/api/admin/products?${params.toString()}`);
                setData((current) => current ? { ...current, products: append ? [...current.products, ...response.products] : response.products, product_pagination: response.pagination } : current);
            } else {
                const response = await api<{ inquiries: Inquiry[]; pagination: PaginationMeta }>(`/api/admin/inquiries?${params.toString()}`);
                setData((current) => current ? { ...current, inquiries: append ? [...current.inquiries, ...response.inquiries] : response.inquiries, inquiry_pagination: response.pagination } : current);
            }
        } finally { setTableLoading(false); }
    }, []);

    useEffect(() => {
        void api<{ user: unknown }>('/api/admin/me').then(async () => { setAuthenticated(true); await loadDashboard(); }).catch(() => setAuthenticated(false)).finally(() => setReady(true));
    }, [loadDashboard]);

    useEffect(() => {
        if (!authenticated || !data || (tab !== 'products' && tab !== 'inquiries')) return;
        const timer = window.setTimeout(() => { void loadAdminList(tab, 1, query, false, tab === 'products' ? productSort : inquirySort); }, query ? 260 : 0);
        return () => window.clearTimeout(timer);
    }, [authenticated, data === null, inquirySort, loadAdminList, productSort, query, tab]);

    useEffect(() => { if (authenticated && tab === 'settings') void loadSettings(); }, [authenticated, loadSettings, tab]);

    const toast = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2400); };
    const run = async (action: () => Promise<void>, success?: string) => {
        setBusy(true);
        try { await action(); if (success) toast(success); }
        catch (reason) { toast(reason instanceof Error ? reason.message : 'Something went wrong.'); }
        finally { setBusy(false); }
    };

    const submitLogin = async (event: FormEvent) => {
        event.preventDefault(); setBusy(true); setLoginError('');
        try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify(login) }); setAuthenticated(true); await loadDashboard(); }
        catch (reason) { setLoginError(reason instanceof Error ? reason.message : 'Unable to sign in.'); }
        finally { setBusy(false); }
    };

    const logout = () => void run(async () => { await api('/api/admin/logout', { method: 'POST' }); setAuthenticated(false); setData(null); }, 'Signed out');
    const refresh = () => void run(loadDashboard, 'Dashboard refreshed');

    const openCategory = (category?: Category) => {
        setEditingCategory(category || null);
        setCategoryForm(category ? { name: category.name, description: category.description || '', icon: category.icon, sort_order: category.sort_order, is_active: category.is_active } : blankCategory);
        setSubName(''); setCategoryModal(true);
    };

    const saveCategory = (event: FormEvent) => {
        event.preventDefault();
        void run(async () => {
            await api(`/api/admin/categories${editingCategory ? `/${editingCategory.id}` : ''}`, { method: editingCategory ? 'PUT' : 'POST', body: JSON.stringify(categoryForm) });
            await loadDashboard(); await onCatalogChanged(); setCategoryModal(false);
        }, editingCategory ? 'Category updated' : 'Category created');
    };

    const addSubcategory = () => {
        if (!editingCategory || !subName.trim()) return;
        void run(async () => {
            await api('/api/admin/subcategories', { method: 'POST', body: JSON.stringify({ category_id: editingCategory.id, name: subName, description: '', sort_order: editingCategory.subcategories.length + 1, is_active: true }) });
            await loadDashboard(); await onCatalogChanged(); setSubName('');
            const latest = await api<AdminData>('/api/admin/dashboard'); setData(latest); setEditingCategory(latest.categories.find((item) => item.id === editingCategory.id) || null);
        }, 'Subcategory added');
    };

    const removeSubcategory = (subcategory: Subcategory) => {
        if (!window.confirm(`Remove “${subcategory.name}”?`)) return;
        void run(async () => {
            await api(`/api/admin/subcategories/${subcategory.id}`, { method: 'DELETE' }); await loadDashboard(); await onCatalogChanged();
            setEditingCategory((current) => current ? { ...current, subcategories: current.subcategories.filter((item) => item.id !== subcategory.id) } : null);
        }, 'Subcategory removed');
    };

    const deleteCategory = (category: Category) => {
        if (!window.confirm(`Remove “${category.name}”? Categories with products are protected.`)) return;
        void run(async () => { await api(`/api/admin/categories/${category.id}`, { method: 'DELETE' }); await loadDashboard(); await onCatalogChanged(); }, 'Category removed');
    };

    const openProduct = (product?: Product) => {
        setEditingProduct(product || null);
        setProductForm(product ? {
            category_id: product.category_id, subcategory_id: product.subcategory_id || null, name: product.name,
            short_description: product.short_description, description: product.description || '', base_price: Number(product.base_price), preparation_hours: product.preparation_hours,
            image_slot: product.image_slot, image_url: product.image_url || '',
            is_featured: product.is_featured, is_active: product.is_active, sort_order: product.sort_order,
            occasion_ids: product.occasions.map((item) => item.id), style_ids: product.styles.map((item) => item.id), flavor_ids: product.flavors.map((item) => item.id), allergen_ids: product.allergens.map((item) => item.id), badge_ids: product.badges.map((item) => item.id),
            variants: product.variants.map((variant) => ({ name: variant.name, price: Number(variant.price), serves: variant.serves || '', serves_min: variant.serves_min || null, serves_max: variant.serves_max || null, is_active: variant.is_active })),
        } : { ...blankProduct, category_id: data?.categories[0]?.id || 0, variants: blankProduct.variants.map((variant) => ({ ...variant })) });
        setProductModal(true);
    };

    const toggleProductAttribute = (key: 'occasion_ids' | 'style_ids' | 'flavor_ids' | 'allergen_ids' | 'badge_ids', id: number) => {
        setProductForm((current) => ({ ...current, [key]: current[key].includes(id) ? current[key].filter((value) => value !== id) : [...current[key], id] }));
    };

    const uploadProductImage = (file?: File) => {
        if (!file) return;
        const body = new FormData(); body.append('image', file); setUploading(true);
        void api<{ url: string }>('/api/admin/product-images', { method: 'POST', body }).then(({ url }) => { setProductForm((current) => ({ ...current, image_url: url })); toast('Product image uploaded'); }).catch((reason) => toast(reason instanceof Error ? reason.message : 'Image upload failed.')).finally(() => setUploading(false));
    };

    const sortTable = (kind: 'products' | 'inquiries', column: string) => {
        const current = kind === 'products' ? productSort : inquirySort;
        const next: SortState = { column, direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc' };
        if (kind === 'products') setProductSort(next); else setInquirySort(next);
    };

    const saveProduct = (event: FormEvent) => {
        event.preventDefault();
        void run(async () => {
            await api(`/api/admin/products${editingProduct ? `/${editingProduct.id}` : ''}`, { method: editingProduct ? 'PUT' : 'POST', body: JSON.stringify(productForm) });
            await loadDashboard(); await onCatalogChanged(); setProductModal(false);
        }, editingProduct ? 'Product updated' : 'Product created');
    };

    const deleteProduct = (product: Product) => {
        if (!window.confirm(`Remove “${product.name}” from the catalogue?`)) return;
        void run(async () => { await api(`/api/admin/products/${product.id}`, { method: 'DELETE' }); await loadDashboard(); await onCatalogChanged(); }, 'Product removed');
    };

    const openInquiry = (inquiry: Inquiry) => { setSelectedInquiry(inquiry); setInquiryStatus(inquiry.status); setInternalNotes(inquiry.internal_notes || ''); };
    const saveInquiry = () => selectedInquiry && void run(async () => {
        await api(`/api/admin/inquiries/${selectedInquiry.id}`, { method: 'PUT', body: JSON.stringify({ status: inquiryStatus, internal_notes: internalNotes }) });
        await loadDashboard(); setSelectedInquiry(null);
    }, 'Inquiry updated');

    const createAttribute = () => {
        if (!attributeName.trim()) return;
        const collection = data?.[attributeType] || [];
        void run(async () => {
            await api(`/api/admin/attributes/${attributeType}`, { method: 'POST', body: JSON.stringify({ name: attributeName.trim(), description: '', tone: attributeType === 'badges' ? 'gold' : undefined, sort_order: collection.length + 1, is_active: true }) });
            setAttributeName(''); await loadDashboard(); await onCatalogChanged();
        }, 'Option created');
    };

    const editAttribute = (item: CatalogAttribute) => {
        const name = window.prompt('Update name', item.name)?.trim();
        if (!name || name === item.name) return;
        void run(async () => {
            await api(`/api/admin/attributes/${attributeType}/${item.id}`, { method: 'PUT', body: JSON.stringify({ name, description: item.description || '', tone: attributeType === 'badges' ? item.tone || 'gold' : undefined, sort_order: item.sort_order, is_active: item.is_active }) });
            await loadDashboard(); await onCatalogChanged();
        }, 'Option updated');
    };

    const deleteAttribute = (item: CatalogAttribute) => {
        if (!window.confirm(`Remove “${item.name}”? Linked options are protected.`)) return;
        void run(async () => { await api(`/api/admin/attributes/${attributeType}/${item.id}`, { method: 'DELETE' }); await loadDashboard(); await onCatalogChanged(); }, 'Option removed');
    };

    const createRole = () => {
        if (!newRole.name.trim() || newRole.menu_items.length === 0) return;
        void run(async () => { await api('/api/admin/roles', { method: 'POST', body: JSON.stringify({ ...newRole, description: '', permissions: [], is_active: true }) }); setNewRole({ name: '', menu_items: ['overview', 'inquiries'] }); await loadSettings(); }, 'User type created');
    };

    const toggleRoleMenu = (role: Role, menu: string) => {
        const menu_items = role.menu_items.includes(menu) ? role.menu_items.filter((item) => item !== menu) : [...role.menu_items, menu];
        if (menu_items.length === 0) return;
        void run(async () => { await api(`/api/admin/roles/${role.id}`, { method: 'PUT', body: JSON.stringify({ name: role.name, description: role.description || '', menu_items, permissions: role.permissions || [], is_active: role.is_active }) }); await loadSettings(); await loadDashboard(); }, 'Sidebar access updated');
    };

    const deleteRole = (role: Role) => {
        if (!window.confirm(`Remove user type “${role.name}”?`)) return;
        void run(async () => { await api(`/api/admin/roles/${role.id}`, { method: 'DELETE' }); await loadSettings(); }, 'User type removed');
    };

    const createUser = () => {
        if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password || !newUser.role_id) return;
        void run(async () => { await api('/api/admin/users', { method: 'POST', body: JSON.stringify(newUser) }); setNewUser({ name: '', email: '', password: '', role_id: 0 }); await loadSettings(); }, 'Admin user created');
    };

    const updateUserRole = (user: AdminUser, roleId: number) => void run(async () => { await api(`/api/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ name: user.name, email: user.email, password: '', role_id: roleId }) }); await loadSettings(); }, 'User type updated');
    const deleteUser = (user: AdminUser) => {
        if (!window.confirm(`Remove admin user “${user.name}”?`)) return;
        void run(async () => { await api(`/api/admin/users/${user.id}`, { method: 'DELETE' }); await loadSettings(); }, 'Admin user removed');
    };

    const filteredProducts = useMemo(() => (data?.products || []).filter((product) => `${product.name} ${product.category?.name}`.toLowerCase().includes(query.toLowerCase())), [data?.products, query]);
    const filteredInquiries = useMemo(() => (data?.inquiries || []).filter((inquiry) => `${inquiry.reference} ${inquiry.customer_name} ${inquiry.phone}`.toLowerCase().includes(query.toLowerCase())), [data?.inquiries, query]);

    if (!ready) return <div className="admin-loading"><LoaderCircle className="spin" /><span>Opening the bakery office…</span></div>;
    if (!authenticated) return <div className="login-page"><button className="back-store" onClick={returnToStore}><ArrowLeft size={17} /> Back to catalogue</button><div className="login-visual"><span className="eyebrow">The kitchen, beautifully organised</span><h1>Every inquiry.<br />Every creation.<br /><em>One calm workspace.</em></h1><div className="login-metrics"><div><b>23</b><span>Signature creations</span></div><div><b>24/7</b><span>Inquiry capture</span></div><div><b>1</b><span>Elegant workflow</span></div></div></div><form className="login-card" onSubmit={submitLogin}><span className="brand-mark">SB</span><p className="section-kicker">Sweet Boutique Office</p><h2>Welcome back</h2><p>Sign in to manage the catalogue and customer inquiries.</p><label>Email address<input type="email" required autoComplete="username" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label><label>Password<input type="password" required autoComplete="current-password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>{loginError && <div className="form-error">{loginError}</div>}<button className="primary-button full-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <ChevronRight size={18} />} {busy ? 'Signing in…' : 'Enter the office'}</button></form></div>;
    if (!data) return <div className="admin-loading"><LoaderCircle className="spin" /><span>Preparing your dashboard…</span></div>;

    const allNav = [
        { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard }, { id: 'inquiries' as const, label: 'Inquiries', icon: Inbox, count: data.stats.new_inquiries },
        { id: 'products' as const, label: 'Products', icon: Boxes }, { id: 'categories' as const, label: 'Categories', icon: FolderTree }, { id: 'attributes' as const, label: 'Finder options', icon: SlidersHorizontal }, { id: 'settings' as const, label: 'Team & access', icon: Settings },
    ];
    const allowedMenus = data.current_user.role?.menu_items || allNav.map((item) => item.id);
    const nav = allNav.filter((item) => allowedMenus.includes(item.id));
    const todayLabel = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });

    return <div className="admin-shell">
        <aside className="admin-sidebar"><button className="admin-brand" onClick={returnToStore}><span className="brand-mark">SB</span><span><b>Sweet Boutique</b><small>Kitchen office</small></span></button><nav>{nav.map(({ id, label, icon: Icon, count }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setQuery(''); }}><Icon size={19} /><span>{label}</span>{count ? <b>{count}</b> : null}</button>)}</nav><div className="sidebar-profile"><span>{data.current_user.name.slice(0, 2).toUpperCase()}</span><div><b>{data.current_user.name}</b><small>{data.current_user.role?.name || 'Administrator'}</small></div><MoreHorizontal size={18} /></div><div className="sidebar-bottom"><button onClick={returnToStore}><ShoppingBag size={18} />View catalogue</button>{allowedMenus.includes('settings') && <button onClick={() => setTab('settings')}><Settings size={18} />Team & access</button>}<button onClick={logout}><LogOut size={18} />Sign out</button></div></aside>
        <main className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">{todayLabel} · Operations</span><h1>{nav.find((item) => item.id === tab)?.label}</h1></div><div className="admin-actions">{tab !== 'overview' && <label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tab}…`} /></label>}<span className="topbar-live"><i />Catalogue live</span><button className="icon-button" onClick={refresh} aria-label="Refresh"><RefreshCw size={18} /></button>{tab === 'products' && <button className="primary-button" onClick={() => openProduct()}><Plus size={18} />New product</button>}{tab === 'categories' && <button className="primary-button" onClick={() => openCategory()}><Plus size={18} />New category</button>}</div></header>
            <div className="admin-content">
                {tab === 'overview' && <AdminOverview data={data} openInquiry={(inquiry) => { setTab('inquiries'); openInquiry(inquiry); }} openInquiries={() => setTab('inquiries')} openProducts={() => setTab('products')} />}
                {tab === 'inquiries' && <InquiryTable inquiries={filteredInquiries} total={data.inquiry_pagination.total} hasMore={data.inquiry_pagination.has_more} loading={tableLoading} sort={inquirySort} onSort={(column) => sortTable('inquiries', column)} onLoadMore={() => void loadAdminList('inquiries', data.inquiry_pagination.current_page + 1, query, true, inquirySort)} onOpen={openInquiry} />}
                {tab === 'products' && <ProductTable products={filteredProducts} total={data.product_pagination.total} hasMore={data.product_pagination.has_more} loading={tableLoading} sort={productSort} onSort={(column) => sortTable('products', column)} onLoadMore={() => void loadAdminList('products', data.product_pagination.current_page + 1, query, true, productSort)} onEdit={openProduct} onDelete={deleteProduct} />}
                {tab === 'categories' && <CategoryTable categories={data.categories} onEdit={openCategory} onDelete={deleteCategory} />}
                {tab === 'attributes' && <AttributeManager type={attributeType} setType={setAttributeType} items={data[attributeType]} name={attributeName} setName={setAttributeName} onCreate={createAttribute} onEdit={editAttribute} onDelete={deleteAttribute} />}
                {tab === 'settings' && <SettingsManager data={settingsData} roleForm={newRole} setRoleForm={setNewRole} userForm={newUser} setUserForm={setNewUser} onCreateRole={createRole} onToggleRoleMenu={toggleRoleMenu} onDeleteRole={deleteRole} onCreateUser={createUser} onUpdateUserRole={updateUserRole} onDeleteUser={deleteUser} />}
            </div></main>

        <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title={editingCategory ? 'Edit category' : 'Create category'} eyebrow="Catalogue structure" className="admin-form-modal"><form className="admin-form" onSubmit={saveCategory}><div className="form-grid"><label>Name<input required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></label><label>Icon<select value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}><option value="cake">Cake</option><option value="sparkles">Sparkles</option><option value="dessert">Dessert</option><option value="croissant">Croissant</option><option value="wheat">Bread</option></select></label><label className="span-two">Description<input value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></label><label>Display order<input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })} /></label><label className="switch-label"><input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />Visible in catalogue</label></div>{editingCategory && <div className="subcategory-editor"><div><h3>Subcategories</h3><span>{editingCategory.subcategories.length} configured</span></div>{editingCategory.subcategories.map((subcategory) => <div className="subcategory-row" key={subcategory.id}><span>{subcategory.name}</span><button type="button" onClick={() => removeSubcategory(subcategory)}><Trash2 size={15} /></button></div>)}<div className="subcategory-add"><input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="New subcategory name" /><button type="button" onClick={addSubcategory}><Plus size={16} />Add</button></div></div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setCategoryModal(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy && <LoaderCircle className="spin" size={17} />}Save category</button></div></form></Modal>

        <Modal open={productModal} onClose={() => setProductModal(false)} title={editingProduct ? 'Edit creation' : 'Add a new creation'} eyebrow="Product catalogue" className="admin-form-modal wide">
            <form className="admin-form" onSubmit={saveProduct}>
                <div className="form-grid">
                    <label>Name<input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></label>
                    <label>Starting price (CAD)<input type="number" min="0" step="0.01" required value={productForm.base_price} onChange={(e) => setProductForm({ ...productForm, base_price: Number(e.target.value) })} /></label>
                    <label>Preparation time (hours)<input type="number" min="1" max="8760" step="1" required value={productForm.preparation_hours} onChange={(e) => setProductForm({ ...productForm, preparation_hours: Number(e.target.value) })} /></label>
                    <label>Category<SmartSelect value={productForm.category_id || null} placeholder="Choose category" options={data.categories.map((category) => ({ value: category.id, label: category.name }))} onChange={(value) => setProductForm({ ...productForm, category_id: Number(value || 0), subcategory_id: null })} /></label>
                    <label>Subcategory<SmartSelect value={productForm.subcategory_id} placeholder="No subcategory" options={(data.categories.find((category) => category.id === productForm.category_id)?.subcategories || []).map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))} onChange={(value) => setProductForm({ ...productForm, subcategory_id: value ? Number(value) : null })} /></label>
                    <label className="span-two">Short description<input required value={productForm.short_description} onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })} placeholder="Dark cocoa · Belgian ganache" /></label>
                    <label className="span-two">Full description<textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></label>
                </div>
                <section className="admin-upload-panel">
                    <div className={`admin-upload-preview ${productForm.image_slot}`} style={productForm.image_url ? { backgroundImage: `url(${productForm.image_url})` } : undefined}>{uploading && <LoaderCircle className="spin" />}</div>
                    <div><span className="section-kicker">Product photography</span><h3>Upload a catalogue image</h3><p>JPG, PNG or WebP up to 5 MB. Uploaded photography overrides the fallback artwork.</p><label className="upload-button"><UploadCloud size={17} />{uploading ? 'Uploading…' : 'Choose file'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => uploadProductImage(event.target.files?.[0])} /></label></div>
                </section>
                <div className="image-picker"><span>Fallback artwork</span><div>{Array.from({ length: 8 }, (_, index) => `sprite-${index + 1}`).map((slot) => <button type="button" key={slot} className={`${slot} ${productForm.image_slot === slot ? 'active' : ''}`} onClick={() => setProductForm({ ...productForm, image_slot: slot })}>{productForm.image_slot === slot && <Check size={17} />}</button>)}</div></div>
                <div className="attribute-form-grid">
                    <AttributePicker title="Occasions" hint="Where this product should be recommended" items={data.occasions} selected={productForm.occasion_ids} onToggle={(id) => toggleProductAttribute('occasion_ids', id)} />
                    <AttributePicker title="Cake styles" hint="Finder style classification" items={data.styles} selected={productForm.style_ids} onToggle={(id) => toggleProductAttribute('style_ids', id)} />
                    <AttributePicker title="Flavours" hint="Customer love and avoid filters" items={data.flavors} selected={productForm.flavor_ids} onToggle={(id) => toggleProductAttribute('flavor_ids', id)} />
                    <AttributePicker title="Allergens" hint="Products are excluded when selected" items={data.allergens} selected={productForm.allergen_ids} onToggle={(id) => toggleProductAttribute('allergen_ids', id)} danger />
                    <AttributePicker title="Merchandising badges" hint="Bestseller, seasonal and chef picks" items={data.badges} selected={productForm.badge_ids} onToggle={(id) => toggleProductAttribute('badge_ids', id)} />
                </div>
                <div className="variant-editor"><div><div><span className="section-kicker">Capacity & pricing</span><h3>Sizes and serving ranges</h3></div><button type="button" className="secondary-button" onClick={() => setProductForm({ ...productForm, variants: [...productForm.variants, { name: '', price: productForm.base_price, serves: '', serves_min: null, serves_max: null, is_active: true }] })}><Plus size={15} />Add size</button></div>
                    <div className="variant-head"><span>Size</span><span>Minimum guests</span><span>Maximum guests</span><span>Price CAD</span><span /></div>
                    {productForm.variants.map((variant, index) => <div className="variant-row" key={index}>
                        <input required value={variant.name} onChange={(e) => setProductForm({ ...productForm, variants: productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) })} placeholder="Classic" />
                        <input type="number" min="1" value={variant.serves_min || ''} onChange={(e) => setProductForm({ ...productForm, variants: productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, serves_min: e.target.value ? Number(e.target.value) : null, serves: `${e.target.value || '?'}–${item.serves_max || '?'} guests` } : item) })} placeholder="8" />
                        <input type="number" min="1" value={variant.serves_max || ''} onChange={(e) => setProductForm({ ...productForm, variants: productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, serves_max: e.target.value ? Number(e.target.value) : null, serves: `${item.serves_min || '?'}–${e.target.value || '?'} guests` } : item) })} placeholder="12" />
                        <input type="number" min="0" step="0.01" value={variant.price} onChange={(e) => setProductForm({ ...productForm, variants: productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(e.target.value) } : item) })} placeholder="Price" />
                        <button type="button" className="variant-remove" aria-label="Remove size" disabled={productForm.variants.length === 1} onClick={() => setProductForm({ ...productForm, variants: productForm.variants.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} /></button>
                    </div>)}
                </div>
                <div className="toggle-row"><label className="switch-label"><input type="checkbox" checked={productForm.is_active} onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })} />Available</label><label className="switch-label"><input type="checkbox" checked={productForm.is_featured} onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })} />Featured on home page</label></div>
                <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setProductModal(false)}>Cancel</button><button className="primary-button" disabled={busy || uploading}>{busy && <LoaderCircle className="spin" size={17} />}Save product</button></div>
            </form>
        </Modal>

        <Modal open={!!selectedInquiry} onClose={() => setSelectedInquiry(null)} title={selectedInquiry?.reference} eyebrow="Inquiry details" className="inquiry-admin-modal">{selectedInquiry && <div className="inquiry-admin-grid"><section><div className="customer-card"><span className="avatar">{selectedInquiry.customer_name.slice(0, 2).toUpperCase()}</span><div><h3>{selectedInquiry.customer_name}</h3><a href={`tel:${selectedInquiry.phone}`}><Phone size={15} />{selectedInquiry.phone}</a>{selectedInquiry.email && <a href={`mailto:${selectedInquiry.email}`}><Mail size={15} />{selectedInquiry.email}</a>}</div></div><dl className="inquiry-facts"><div><dt>Event</dt><dd>{selectedInquiry.event_type || 'Not specified'}</dd></div><div><dt>Date</dt><dd>{selectedInquiry.event_date || 'Flexible'}</dd></div><div><dt>Fulfilment</dt><dd>{selectedInquiry.fulfilment}</dd></div><div><dt>Estimate</dt><dd>{money(selectedInquiry.estimated_total)}</dd></div></dl><h3>Requested items</h3>{selectedInquiry.items.map((item) => <div className="admin-item" key={item.id}><span><b>{item.product_name}</b><small>{item.variant_name || 'Personal brief'} · Qty {item.quantity}</small></span><strong>{Number(item.unit_price) ? money(Number(item.unit_price) * item.quantity) : 'Quote'}</strong></div>)}</section><section className="inquiry-workflow"><label>Status<select value={inquiryStatus} onChange={(e) => setInquiryStatus(e.target.value as Inquiry['status'])}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Internal notes<textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Call outcome, quote details, kitchen notes…" /></label>{selectedInquiry.customer_notes && <div className="customer-note"><b>Customer note</b><p>{selectedInquiry.customer_notes}</p></div>}<button className="primary-button full-button" onClick={saveInquiry} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}Save update</button></section></div>}</Modal>
        {notice && <div className="toast"><Check size={17} />{notice}</div>}
    </div>;
}

function Overview({ data, openInquiry }: { data: AdminData; openInquiry: (inquiry: Inquiry) => void }) {
    const stats = [
        { label: 'New inquiries', value: data.stats.new_inquiries, icon: Inbox, tone: 'berry', note: 'Awaiting first response' },
        { label: 'Active quotes', value: data.stats.active_quotes, icon: CircleDollarSign, tone: 'gold', note: 'In conversation' },
        { label: 'Confirmed', value: data.stats.confirmed, icon: PackageCheck, tone: 'green', note: 'Ready for production' },
        { label: 'Live products', value: data.stats.products, icon: CakeSlice, tone: 'brown', note: 'Across the catalogue' },
    ];
    const statusCounts = ['new', 'contacted', 'quoted', 'confirmed'].map((status) => ({ status, count: data.inquiries.filter((inquiry) => inquiry.status === status).length }));
    const max = Math.max(1, ...statusCounts.map((item) => item.count));
    return <><section className="stat-grid">{stats.map(({ label, value, icon: Icon, tone, note }) => <article className={`stat-card ${tone}`} key={label}><span><Icon size={20} /></span><div><small>{label}</small><b>{value}</b><p>{note}</p></div></article>)}</section><div className="overview-grid"><section className="dashboard-panel"><div className="panel-heading"><div><span className="section-kicker">Live pipeline</span><h2>Inquiry momentum</h2></div><BarChart3 size={20} /></div><div className="pipeline-chart">{statusCounts.map((item) => <div key={item.status}><span className="bar-track"><i style={{ height: `${Math.max(12, item.count / max * 100)}%` }} /></span><b>{item.count}</b><small>{statusLabel[item.status as keyof typeof statusLabel]}</small></div>)}</div></section><section className="dashboard-panel recent-panel"><div className="panel-heading"><div><span className="section-kicker">Latest requests</span><h2>Recent inquiries</h2></div><ClipboardList size={20} /></div>{data.inquiries.slice(0, 5).map((inquiry) => <button className="recent-row" key={inquiry.id} onClick={() => openInquiry(inquiry)}><span className="avatar small">{inquiry.customer_name.slice(0, 2).toUpperCase()}</span><span><b>{inquiry.customer_name}</b><small>{inquiry.items[0]?.product_name || 'Custom request'}</small></span><span className={`status-badge ${inquiry.status}`}>{statusLabel[inquiry.status]}</span><ChevronRight size={16} /></button>)}{data.inquiries.length === 0 && <div className="panel-empty"><Sparkles size={23} /><span>Your first inquiry will appear here.</span></div>}</section></div></>;
}

function InquiryTable({ inquiries, total, hasMore, loading, sort, onSort, onLoadMore, onOpen }: { inquiries: Inquiry[]; total: number; hasMore: boolean; loading: boolean; sort: SortState; onSort: (column: string) => void; onLoadMore: () => void; onOpen: (inquiry: Inquiry) => void }) {
    return <section className="data-panel"><div className="table-heading"><div><span className="section-kicker">Customer requests</span><h2>Inquiry queue</h2></div><span>Showing {inquiries.length} of {total}</span></div><div className="admin-data-table"><table><thead><tr><SortHead label="Reference" column="reference" sort={sort} onSort={onSort} /><SortHead label="Customer" column="customer" sort={sort} onSort={onSort} /><SortHead label="Event" column="event_date" sort={sort} onSort={onSort} /><SortHead label="Estimate" column="total" sort={sort} onSort={onSort} /><SortHead label="Status" column="status" sort={sort} onSort={onSort} /><th aria-label="Open" /></tr></thead><tbody>{inquiries.map((inquiry) => <tr key={inquiry.id} tabIndex={0} onClick={() => onOpen(inquiry)}><td><b>{inquiry.reference}</b><small>{new Date(inquiry.created_at).toLocaleDateString('en-CA', { day: '2-digit', month: 'short' })}</small></td><td><b>{inquiry.customer_name}</b><small>{inquiry.phone}</small></td><td><b>{inquiry.event_type || 'General inquiry'}</b><small>{inquiry.event_date || 'Flexible date'}</small></td><td><strong>{money(inquiry.estimated_total)}</strong></td><td><i className={`status-badge ${inquiry.status}`}>{statusLabel[inquiry.status]}</i></td><td><ChevronRight size={17} /></td></tr>)}{inquiries.length === 0 && <tr><td colSpan={6}><div className="panel-empty"><Inbox size={24} /><span>No inquiries match this search.</span></div></td></tr>}</tbody></table></div>{hasMore && <div className="admin-pagination"><button onClick={onLoadMore} disabled={loading}>{loading && <LoaderCircle className="spin" size={16} />}{loading ? 'Loading…' : `Load next page · ${inquiries.length} of ${total}`}</button></div>}</section>;
}

function ProductTable({ products, total, hasMore, loading, sort, onSort, onLoadMore, onEdit, onDelete }: { products: Product[]; total: number; hasMore: boolean; loading: boolean; sort: SortState; onSort: (column: string) => void; onLoadMore: () => void; onEdit: (product: Product) => void; onDelete: (product: Product) => void }) {
    return <section className="data-panel"><div className="table-heading"><div><span className="section-kicker">Menu management</span><h2>Product catalogue</h2></div><span>Showing {products.length} of {total}</span></div><div className="admin-data-table"><table><thead><tr><th>Image</th><SortHead label="Product" column="name" sort={sort} onSort={onSort} /><th>Finder data</th><th>Serves</th><SortHead label="Price" column="price" sort={sort} onSort={onSort} /><SortHead label="Status" column="status" sort={sort} onSort={onSort} /><th>Actions</th></tr></thead><tbody>{products.map((product) => { const capacities = product.variants.map((variant) => variant.serves_max).filter(Boolean) as number[]; return <tr key={product.id}><td><span className={`table-product-image ${product.image_slot}`} style={product.image_url ? { backgroundImage: `url(${product.image_url})` } : undefined} /></td><td><b>{product.name}</b><small>{product.category?.name}{product.subcategory ? ` · ${product.subcategory.name}` : ''}</small></td><td><div className="table-tags">{product.badges.map((item) => <span className="gold" key={item.id}>{item.name}</span>)}{product.flavors.slice(0, 3).map((item) => <span key={item.id}>{item.name}</span>)}{product.flavors.length === 0 && <small>No flavours linked</small>}</div></td><td><b>{capacities.length ? `Up to ${Math.max(...capacities)} guests` : 'Not set'}</b><small>{product.variants.length} size{product.variants.length === 1 ? '' : 's'}</small></td><td><strong>{money(product.base_price)}</strong><small>{product.preparation_hours}h preparation</small></td><td><span className={product.is_active ? 'availability live' : 'availability'}>{product.is_active ? 'Live' : 'Hidden'}</span></td><td><span className="card-actions"><button onClick={() => onEdit(product)} aria-label="Edit"><Pencil size={16} /></button><button onClick={() => onDelete(product)} aria-label="Delete"><Trash2 size={16} /></button></span></td></tr>; })}{products.length === 0 && <tr><td colSpan={7}><div className="panel-empty"><Boxes size={24} /><span>No products match this search.</span></div></td></tr>}</tbody></table></div>{hasMore && <div className="admin-pagination"><button onClick={onLoadMore} disabled={loading}>{loading && <LoaderCircle className="spin" size={16} />}{loading ? 'Loading…' : `Load next page · ${products.length} of ${total}`}</button></div>}</section>;
}

function CategoryTable({ categories, onEdit, onDelete }: { categories: Category[]; onEdit: (category: Category) => void; onDelete: (category: Category) => void }) {
    return <section className="data-panel"><div className="table-heading"><div><span className="section-kicker">Catalogue structure</span><h2>Categories & subcategories</h2></div><span>{categories.length} categories</span></div><div className="admin-data-table"><table><thead><tr><th>Order</th><th>Category</th><th>Subcategories</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td><b>#{category.sort_order}</b></td><td><b>{category.name}</b><small>{category.description || 'No description'}</small></td><td><div className="table-tags">{category.subcategories.map((subcategory) => <span key={subcategory.id}>{subcategory.name}</span>)}{category.subcategories.length === 0 && <small>No subcategories yet</small>}</div></td><td><span className={category.is_active ? 'availability live' : 'availability'}>{category.is_active ? 'Visible' : 'Hidden'}</span></td><td><span className="card-actions"><button onClick={() => onEdit(category)}><Pencil size={15} />Edit</button><button onClick={() => onDelete(category)} aria-label="Delete"><Trash2 size={15} /></button></span></td></tr>)}</tbody></table></div></section>;
}

function SortHead({ label, column, sort, onSort }: { label: string; column: string; sort: SortState; onSort: (column: string) => void }) {
    return <th><button type="button" className={sort.column === column ? 'active' : ''} onClick={() => onSort(column)}>{label}<span>{sort.column === column ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>;
}

function AttributePicker({ title, hint, items, selected, onToggle, danger = false }: { title: string; hint: string; items: CatalogAttribute[]; selected: number[]; onToggle: (id: number) => void; danger?: boolean }) {
    return <section className="attribute-picker"><div><h3>{title}</h3><small>{hint}</small></div><div>{items.map((item) => <button type="button" className={`${selected.includes(item.id) ? 'active' : ''} ${danger ? 'danger' : ''}`} key={item.id} onClick={() => onToggle(item.id)}>{selected.includes(item.id) && <Check size={13} />}{item.name}</button>)}</div></section>;
}

function AttributeManager({ type, setType, items, name, setName, onCreate, onEdit, onDelete }: { type: AttributeType; setType: (type: AttributeType) => void; items: CatalogAttribute[]; name: string; setName: (name: string) => void; onCreate: () => void; onEdit: (item: CatalogAttribute) => void; onDelete: (item: CatalogAttribute) => void }) {
    const labels: Record<AttributeType, string> = { occasions: 'Occasions', styles: 'Cake styles', flavors: 'Flavours', allergens: 'Allergens', badges: 'Badges' };
    return <section className="data-panel attribute-manager"><div className="table-heading"><div><span className="section-kicker">Dynamic finder data</span><h2>Product options & classifications</h2></div><span>{items.length} {labels[type].toLowerCase()}</span></div><div className="attribute-tabs">{(Object.keys(labels) as AttributeType[]).map((key) => <button className={type === key ? 'active' : ''} key={key} onClick={() => setType(key)}>{labels[key]}</button>)}</div><div className="attribute-create"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onCreate(); }} placeholder={`Add ${labels[type].toLowerCase().replace(/s$/, '')}…`} /><button className="primary-button" onClick={onCreate}><Plus size={16} />Add option</button></div><div className="admin-data-table"><table><thead><tr><th>Order</th><th>Name</th><th>Products linked</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>#{item.sort_order}</td><td><b>{item.name}</b><small>{item.slug}</small></td><td><b>{item.products_count || 0}</b></td><td><span className={item.is_active ? 'availability live' : 'availability'}>{item.is_active ? 'Active' : 'Hidden'}</span></td><td><span className="card-actions"><button onClick={() => onEdit(item)}><Pencil size={15} />Edit</button><button onClick={() => onDelete(item)}><Trash2 size={15} /></button></span></td></tr>)}</tbody></table></div></section>;
}

function SettingsManager({ data, roleForm, setRoleForm, userForm, setUserForm, onCreateRole, onToggleRoleMenu, onDeleteRole, onCreateUser, onUpdateUserRole, onDeleteUser }: { data: AdminSettingsData | null; roleForm: { name: string; menu_items: string[] }; setRoleForm: (value: { name: string; menu_items: string[] }) => void; userForm: { name: string; email: string; password: string; role_id: number }; setUserForm: (value: { name: string; email: string; password: string; role_id: number }) => void; onCreateRole: () => void; onToggleRoleMenu: (role: Role, menu: string) => void; onDeleteRole: (role: Role) => void; onCreateUser: () => void; onUpdateUserRole: (user: AdminUser, roleId: number) => void; onDeleteUser: (user: AdminUser) => void }) {
    if (!data) return <div className="admin-loading inline"><LoaderCircle className="spin" /><span>Loading team access…</span></div>;
    const menuLabel = (menu: string) => menu === 'attributes' ? 'Finder options' : menu.replace(/(^|_)(\w)/g, (_, __, letter) => ` ${letter.toUpperCase()}`).trim();
    const toggleNewMenu = (menu: string) => setRoleForm({ ...roleForm, menu_items: roleForm.menu_items.includes(menu) ? roleForm.menu_items.filter((item) => item !== menu) : [...roleForm.menu_items, menu] });
    return <div className="settings-grid">
        <section className="data-panel"><div className="table-heading"><div><span className="section-kicker">Role-based navigation</span><h2>User types</h2></div><span>{data.roles.length} roles</span></div><div className="settings-create"><label>Role name<input value={roleForm.name} onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })} placeholder="Sales coordinator" /></label><div><span>Sidebar sections</span><div className="menu-permission-row">{data.available_menus.map((menu) => <button type="button" className={roleForm.menu_items.includes(menu) ? 'active' : ''} key={menu} onClick={() => toggleNewMenu(menu)}>{roleForm.menu_items.includes(menu) && <Check size={12} />}{menuLabel(menu)}</button>)}</div></div><button className="primary-button" onClick={onCreateRole}><Plus size={16} />Create user type</button></div><div className="role-cards">{data.roles.map((role) => <article key={role.id}><header><div><h3>{role.name}</h3><small>{role.users_count || 0} assigned user{role.users_count === 1 ? '' : 's'}</small></div><button onClick={() => onDeleteRole(role)} aria-label="Delete role"><Trash2 size={15} /></button></header><p>Choose exactly which sections appear in this role’s admin sidebar.</p><div className="menu-permission-row">{data.available_menus.map((menu) => <button type="button" className={role.menu_items.includes(menu) ? 'active' : ''} key={menu} onClick={() => onToggleRoleMenu(role, menu)}>{role.menu_items.includes(menu) && <Check size={12} />}{menuLabel(menu)}</button>)}</div></article>)}</div></section>
        <section className="data-panel"><div className="table-heading"><div><span className="section-kicker">Team accounts</span><h2>Admin users</h2></div><span>{data.users.length} users</span></div><div className="user-create-grid"><label>Full name<input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} /></label><label>Email<input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} /></label><label>Temporary password<input type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} /></label><label>User type<SmartSelect value={userForm.role_id || null} placeholder="Choose user type" options={data.roles.filter((role) => role.is_active).map((role) => ({ value: role.id, label: role.name }))} onChange={(value) => setUserForm({ ...userForm, role_id: Number(value || 0) })} /></label><button className="primary-button" onClick={onCreateUser}><Plus size={16} />Add admin user</button></div><div className="admin-data-table"><table><thead><tr><th>User</th><th>Email</th><th>User type</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id}><td><b>{user.name}</b><small>Admin account</small></td><td>{user.email}</td><td><SmartSelect value={user.role_id || null} placeholder="No role" options={data.roles.map((role) => ({ value: role.id, label: role.name }))} onChange={(value) => value && onUpdateUserRole(user, Number(value))} /></td><td>{new Date(user.created_at).toLocaleDateString('en-CA', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><span className="card-actions"><button onClick={() => onDeleteUser(user)}><Trash2 size={15} />Remove</button></span></td></tr>)}</tbody></table></div></section>
    </div>;
}

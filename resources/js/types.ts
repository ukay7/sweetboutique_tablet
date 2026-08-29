export type Subcategory = { id: number; category_id: number; name: string; slug: string; description?: string | null; sort_order: number; is_active: boolean };
export type Category = { id: number; name: string; slug: string; description?: string | null; icon: string; sort_order: number; is_active: boolean; subcategories: Subcategory[] };
export type CatalogAttribute = { id: number; name: string; slug: string; description?: string | null; tone?: string | null; sort_order: number; is_active: boolean; products_count?: number };
export type Role = { id: number; name: string; slug: string; description?: string | null; menu_items: string[]; permissions: string[]; is_active: boolean; users_count?: number };
export type AdminUser = { id: number; role_id?: number | null; name: string; email: string; is_admin: boolean; created_at: string; role?: Pick<Role, 'id' | 'name' | 'slug' | 'menu_items'> | null };
export type AdminSettingsData = { users: AdminUser[]; roles: Role[]; available_menus: string[] };
export type ProductVariant = { id: number; product_id: number; name: string; price: string; serves?: string | null; serves_min?: number | null; serves_max?: number | null; is_active: boolean };
export type Product = {
    id: number; category_id: number; subcategory_id?: number | null; name: string; slug: string;
    short_description: string; description?: string | null; base_price: string; preparation_hours: number; image_slot: string;
    image_url?: string | null; badge?: string | null; is_featured: boolean;
    is_active: boolean; sort_order: number; category?: Pick<Category, 'id' | 'name' | 'slug'>;
    subcategory?: Pick<Subcategory, 'id' | 'name' | 'slug'> | null; variants: ProductVariant[];
    occasions: CatalogAttribute[]; styles: CatalogAttribute[]; flavors: CatalogAttribute[];
    allergens: CatalogAttribute[]; badges: CatalogAttribute[];
};
export type CartItem = { key: string; product?: Product; variant?: ProductVariant; quantity: number; notes: string; customDetails?: Record<string, string> };
export type InquiryItem = { id: number; product_name: string; variant_name?: string | null; quantity: number; unit_price: string; notes?: string | null; custom_details?: Record<string, string> | null };
export type Inquiry = {
    id: number; reference: string; customer_name: string; phone: string; email?: string | null;
    event_date?: string | null; event_type?: string | null; fulfilment: 'pickup' | 'delivery'; address?: string | null;
    customer_notes?: string | null; internal_notes?: string | null; status: 'new' | 'contacted' | 'quoted' | 'confirmed' | 'cancelled';
    estimated_total: string; created_at: string; items: InquiryItem[];
};
export type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number; has_more: boolean };
export type CatalogData = {
    categories: Category[]; occasions: CatalogAttribute[]; styles: CatalogAttribute[];
    flavors: CatalogAttribute[]; allergens: CatalogAttribute[]; badges: CatalogAttribute[];
    products: Product[]; pagination: PaginationMeta;
};
export type AdminData = {
    current_user: AdminUser;
    stats: { new_inquiries: number; active_quotes: number; confirmed: number; products: number; inquiries: number };
    categories: Category[]; products: Product[]; product_pagination: PaginationMeta;
    inquiries: Inquiry[]; inquiry_pagination: PaginationMeta;
    occasions: CatalogAttribute[]; styles: CatalogAttribute[]; flavors: CatalogAttribute[];
    allergens: CatalogAttribute[]; badges: CatalogAttribute[];
};

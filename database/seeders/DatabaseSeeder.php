<?php

namespace Database\Seeders;

use App\Models\Allergen;
use App\Models\Badge;
use App\Models\CakeStyle;
use App\Models\Category;
use App\Models\Flavor;
use App\Models\Inquiry;
use App\Models\Occasion;
use App\Models\Product;
use App\Models\Role;
use App\Models\Subcategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::updateOrCreate(['slug' => 'super-admin'], [
            'name' => 'Super Admin',
            'description' => 'Full catalogue, inquiry and team administration access.',
            'menu_items' => ['overview', 'inquiries', 'products', 'categories', 'attributes', 'settings'],
            'permissions' => ['catalog.manage', 'inquiries.manage', 'users.manage'],
            'is_active' => true,
        ]);

        $categoryData = [
            ['name' => 'Celebration Cakes', 'slug' => 'celebration-cakes', 'icon' => 'cake', 'description' => 'Statement cakes for life’s sweetest milestones.', 'sort_order' => 1],
            ['name' => 'Signature Cakes', 'slug' => 'signature-cakes', 'icon' => 'sparkles', 'description' => 'Our most distinctive house creations.', 'sort_order' => 2],
            ['name' => 'Desserts & Tarts', 'slug' => 'desserts-tarts', 'icon' => 'dessert', 'description' => 'Elegant individual and sharing desserts.', 'sort_order' => 3],
            ['name' => 'Viennoiserie', 'slug' => 'viennoiserie', 'icon' => 'croissant', 'description' => 'Laminated pastries baked fresh each morning.', 'sort_order' => 4],
            ['name' => 'Artisan Bread', 'slug' => 'artisan-bread', 'icon' => 'wheat', 'description' => 'Slow-fermented loaves with character.', 'sort_order' => 5],
            ['name' => 'Cheesecakes', 'slug' => 'cheesecakes', 'icon' => 'cake', 'description' => 'Baked and chilled cheesecakes with polished finishes.', 'sort_order' => 6],
            ['name' => 'Tea Cakes', 'slug' => 'tea-cakes', 'icon' => 'dessert', 'description' => 'Elegant everyday cakes for tea and gifting.', 'sort_order' => 7],
            ['name' => 'Cookies & Bites', 'slug' => 'cookies-bites', 'icon' => 'dessert', 'description' => 'Small-format treats, cookies and dessert bites.', 'sort_order' => 8],
            ['name' => 'Gift Collections', 'slug' => 'gift-collections', 'icon' => 'sparkles', 'description' => 'Curated bakery boxes ready to share.', 'sort_order' => 9],
            ['name' => 'Dietary Collection', 'slug' => 'dietary-collection', 'icon' => 'wheat', 'description' => 'Thoughtfully selected options for dietary preferences.', 'sort_order' => 10],
        ];

        foreach ($categoryData as $data) {
            Category::updateOrCreate(['slug' => $data['slug']], [...$data, 'is_active' => true]);
        }

        $categories = Category::pluck('id', 'slug');
        $subcategoryData = [
            ['category' => 'celebration-cakes', 'name' => 'Birthday Cakes', 'slug' => 'birthday-cakes'],
            ['category' => 'celebration-cakes', 'name' => 'Anniversary Cakes', 'slug' => 'anniversary-cakes'],
            ['category' => 'signature-cakes', 'name' => 'Chef Signatures', 'slug' => 'chef-signatures'],
            ['category' => 'desserts-tarts', 'name' => 'Tiramisu', 'slug' => 'tiramisu'],
            ['category' => 'desserts-tarts', 'name' => 'Seasonal Tarts', 'slug' => 'seasonal-tarts'],
            ['category' => 'viennoiserie', 'name' => 'Croissants', 'slug' => 'croissants'],
            ['category' => 'artisan-bread', 'name' => 'Sourdough', 'slug' => 'sourdough'],
            ['category' => 'celebration-cakes', 'name' => 'Wedding Cakes', 'slug' => 'wedding-cakes'],
            ['category' => 'signature-cakes', 'name' => 'Modern Classics', 'slug' => 'modern-classics'],
            ['category' => 'desserts-tarts', 'name' => 'Petit Desserts', 'slug' => 'petit-desserts'],
            ['category' => 'viennoiserie', 'name' => 'Morning Boxes', 'slug' => 'morning-boxes'],
            ['category' => 'artisan-bread', 'name' => 'Focaccia', 'slug' => 'focaccia'],
            ['category' => 'cheesecakes', 'name' => 'Baked Cheesecakes', 'slug' => 'baked-cheesecakes'],
            ['category' => 'cheesecakes', 'name' => 'Chilled Cheesecakes', 'slug' => 'chilled-cheesecakes'],
            ['category' => 'tea-cakes', 'name' => 'Loaf Cakes', 'slug' => 'loaf-cakes'],
            ['category' => 'tea-cakes', 'name' => 'Bundt Cakes', 'slug' => 'bundt-cakes'],
            ['category' => 'cookies-bites', 'name' => 'Cookies', 'slug' => 'cookies'],
            ['category' => 'cookies-bites', 'name' => 'Brownies & Bars', 'slug' => 'brownies-bars'],
            ['category' => 'gift-collections', 'name' => 'Celebration Boxes', 'slug' => 'celebration-boxes'],
            ['category' => 'gift-collections', 'name' => 'Corporate Gifting', 'slug' => 'corporate-gifting'],
            ['category' => 'dietary-collection', 'name' => 'Gluten-Smart', 'slug' => 'gluten-smart'],
            ['category' => 'dietary-collection', 'name' => 'Vegan Selection', 'slug' => 'vegan-selection'],
        ];

        foreach ($subcategoryData as $index => $data) {
            Subcategory::updateOrCreate(
                ['category_id' => $categories[$data['category']], 'slug' => $data['slug']],
                ['name' => $data['name'], 'description' => null, 'sort_order' => $index + 1, 'is_active' => true],
            );
        }

        $subcategories = Subcategory::pluck('id', 'slug');

        $referenceData = [
            Occasion::class => ['Birthday', 'Wedding', 'Anniversary', 'Baby Shower', 'Graduation', 'Corporate Event', 'Family Visit', 'Holiday', 'Dinner Party', 'Just Because'],
            CakeStyle::class => ['Sponge', 'Signature', 'Layer Cake', 'Minimal', 'Floral', 'Tiramisu', 'Tarts & Pastries', 'Cheesecake', 'Loaf Cake'],
            Flavor::class => ['Chocolate', 'Vanilla', 'Lemon', 'Coffee', 'Hazelnut', 'Pistachio', 'Strawberry', 'Mixed Berries', 'Caramel', 'Nutella', 'Almond', 'Fruit', 'Coconut', 'Red Velvet'],
            Allergen::class => ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Sesame', 'Alcohol', 'Coffee / Caffeine'],
        ];

        foreach ($referenceData as $model => $names) {
            foreach ($names as $index => $name) {
                $model::updateOrCreate(['slug' => str($name)->slug()], [
                    'name' => $name, 'description' => null, 'sort_order' => $index + 1, 'is_active' => true,
                ]);
            }
        }

        foreach ([
            ['name' => 'Bestseller', 'slug' => 'bestseller', 'tone' => 'gold'],
            ['name' => 'Seasonal', 'slug' => 'seasonal', 'tone' => 'berry'],
            ['name' => "Chef's Pick", 'slug' => 'chefs-pick', 'tone' => 'espresso'],
            ['name' => 'New', 'slug' => 'new', 'tone' => 'green'],
            ['name' => 'Gift Favourite', 'slug' => 'gift-favourite', 'tone' => 'rose'],
        ] as $index => $badge) {
            Badge::updateOrCreate(['slug' => $badge['slug']], [...$badge, 'description' => null, 'sort_order' => $index + 1, 'is_active' => true]);
        }

        $occasions = Occasion::pluck('id', 'slug');
        $styles = CakeStyle::pluck('id', 'slug');
        $flavors = Flavor::pluck('id', 'slug');
        $allergens = Allergen::pluck('id', 'slug');
        $badges = Badge::pluck('id', 'slug');
        $products = [
            ['name' => 'Midnight Truffle', 'slug' => 'midnight-truffle', 'category' => 'celebration-cakes', 'subcategory' => 'birthday-cakes', 'short_description' => 'Dark cocoa · Belgian ganache', 'description' => 'Deep chocolate sponge layered with silk ganache and finished with hand-piped truffles.', 'base_price' => 48, 'image_slot' => 'sprite-1', 'is_featured' => true, 'occasions' => ['birthday', 'dinner-party'], 'styles' => ['sponge', 'layer-cake'], 'flavors' => ['chocolate', 'nutella'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => ['bestseller'], 'servings' => [['Classic', 48, 8, 10], ['Grand', 72, 14, 18], ['Party', 145, 30, 50]]],
            ['name' => 'Strawberry Chantilly', 'slug' => 'strawberry-chantilly', 'category' => 'celebration-cakes', 'subcategory' => 'anniversary-cakes', 'short_description' => 'Vanilla bean · Fresh berries', 'description' => 'A feather-light vanilla sponge with Chantilly cream and a generous crown of strawberries.', 'base_price' => 52, 'image_slot' => 'sprite-2', 'is_featured' => true, 'occasions' => ['birthday', 'anniversary', 'baby-shower'], 'styles' => ['sponge', 'floral'], 'flavors' => ['vanilla', 'strawberry'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => ['seasonal'], 'servings' => [['Classic', 52, 8, 10], ['Grand', 78, 14, 18], ['Party', 158, 30, 50]]],
            ['name' => 'Pistachio Praline', 'slug' => 'pistachio-praline', 'category' => 'signature-cakes', 'subcategory' => 'chef-signatures', 'short_description' => 'Roasted pistachio · White chocolate', 'description' => 'Smooth pistachio mousse, delicate sponge and a crisp praline layer with a mirror finish.', 'base_price' => 64, 'image_slot' => 'sprite-3', 'is_featured' => true, 'occasions' => ['anniversary', 'dinner-party'], 'styles' => ['signature', 'minimal'], 'flavors' => ['pistachio', 'vanilla'], 'allergens' => ['tree-nuts', 'dairy', 'eggs', 'gluten'], 'badges' => ['chefs-pick'], 'servings' => [['Classic', 64, 8, 10], ['Grand', 94, 14, 18], ['Event', 185, 28, 45]]],
            ['name' => 'Classic Tiramisu', 'slug' => 'classic-tiramisu', 'category' => 'desserts-tarts', 'subcategory' => 'tiramisu', 'short_description' => 'Espresso · Mascarpone · Cocoa', 'description' => 'Espresso-soaked savoiardi, mascarpone cream and a generous dusting of fine cocoa.', 'base_price' => 38, 'image_slot' => 'sprite-4', 'is_featured' => false, 'occasions' => ['dinner-party', 'family-visit'], 'styles' => ['tiramisu'], 'flavors' => ['coffee', 'chocolate'], 'allergens' => ['dairy', 'eggs', 'gluten', 'alcohol', 'coffee-caffeine'], 'badges' => [], 'servings' => [['Classic', 38, 6, 8], ['Sharing', 68, 12, 16]]],
            ['name' => 'Butter Croissant Box', 'slug' => 'butter-croissant-box', 'category' => 'viennoiserie', 'subcategory' => 'croissants', 'short_description' => 'French butter · Six pieces', 'description' => 'Crisp, honeycombed croissants folded over three days and baked until deeply golden.', 'base_price' => 19.5, 'image_slot' => 'sprite-5', 'is_featured' => false, 'occasions' => ['family-visit', 'holiday'], 'styles' => ['tarts-pastries'], 'flavors' => ['vanilla'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => ['bestseller'], 'servings' => [['Six piece box', 19.5, 4, 6], ['Twelve piece box', 36, 8, 12]]],
            ['name' => 'Orchard Fruit Tart', 'slug' => 'orchard-fruit-tart', 'category' => 'desserts-tarts', 'subcategory' => 'seasonal-tarts', 'short_description' => 'Vanilla crème · Seasonal fruit', 'description' => 'Buttery pâte sucrée filled with vanilla crème and hand-arranged market fruit.', 'base_price' => 29, 'image_slot' => 'sprite-6', 'is_featured' => false, 'occasions' => ['dinner-party', 'family-visit'], 'styles' => ['tarts-pastries'], 'flavors' => ['vanilla', 'fruit'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => ['seasonal'], 'servings' => [['Classic', 29, 6, 8], ['Large', 44, 10, 12]]],
            ['name' => 'Parisian Macarons', 'slug' => 'parisian-macarons', 'category' => 'gift-collections', 'subcategory' => 'celebration-boxes', 'short_description' => 'Assorted signature flavours', 'description' => 'A jewel box of crisp-shell macarons with silky ganache and curd fillings.', 'base_price' => 24, 'image_slot' => 'sprite-7', 'is_featured' => false, 'occasions' => ['holiday', 'just-because', 'corporate-event'], 'styles' => ['signature'], 'flavors' => ['almond', 'pistachio', 'lemon'], 'allergens' => ['tree-nuts', 'dairy', 'eggs'], 'badges' => ['gift-favourite'], 'servings' => [['Twelve piece box', 24, 6, 12], ['Twenty-four piece box', 44, 12, 24]]],
            ['name' => 'Country Sourdough', 'slug' => 'country-sourdough', 'category' => 'artisan-bread', 'subcategory' => 'sourdough', 'short_description' => '48-hour ferment · Stone baked', 'description' => 'Naturally leavened country loaf with a burnished crust and open, tender crumb.', 'base_price' => 7.8, 'image_slot' => 'sprite-8', 'is_featured' => false, 'occasions' => ['family-visit', 'dinner-party'], 'styles' => ['minimal'], 'flavors' => [], 'allergens' => ['gluten'], 'badges' => [], 'servings' => [['Country loaf', 7.8, 4, 6], ['Large loaf', 12, 8, 10]]],
            ['name' => 'Ivory Wedding Atelier', 'slug' => 'ivory-wedding-atelier', 'category' => 'celebration-cakes', 'subcategory' => 'wedding-cakes', 'short_description' => 'Vanilla · Almond · Swiss meringue', 'description' => 'A refined multi-tier wedding cake with an ivory finish and handcrafted sugar florals.', 'base_price' => 180, 'image_slot' => 'sprite-2', 'is_featured' => true, 'occasions' => ['wedding'], 'styles' => ['layer-cake', 'minimal', 'floral'], 'flavors' => ['vanilla', 'almond'], 'allergens' => ['tree-nuts', 'dairy', 'eggs', 'gluten'], 'badges' => ['chefs-pick'], 'servings' => [['Two tier', 180, 30, 40], ['Three tier', 285, 50, 70], ['Four tier', 420, 75, 100]]],
            ['name' => 'Ruby Red Velvet', 'slug' => 'ruby-red-velvet', 'category' => 'celebration-cakes', 'subcategory' => 'birthday-cakes', 'short_description' => 'Cocoa · Buttermilk · Cream cheese', 'description' => 'Velvet-soft scarlet layers with tangy cream cheese frosting and a clean modern finish.', 'base_price' => 54, 'image_slot' => 'sprite-1', 'is_featured' => true, 'occasions' => ['birthday', 'graduation'], 'styles' => ['layer-cake'], 'flavors' => ['red-velvet', 'chocolate'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => ['new'], 'servings' => [['Classic', 54, 8, 10], ['Grand', 82, 14, 18], ['Party', 160, 30, 50]]],
            ['name' => 'New York Baked Cheesecake', 'slug' => 'new-york-baked-cheesecake', 'category' => 'cheesecakes', 'subcategory' => 'baked-cheesecakes', 'short_description' => 'Cream cheese · Vanilla · Biscuit', 'description' => 'Dense, satin-smooth baked cheesecake with a golden biscuit crust.', 'base_price' => 46, 'image_slot' => 'sprite-3', 'is_featured' => false, 'occasions' => ['birthday', 'dinner-party'], 'styles' => ['cheesecake'], 'flavors' => ['vanilla'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => ['bestseller'], 'servings' => [['Six inch', 46, 6, 8], ['Nine inch', 72, 12, 16]]],
            ['name' => 'Berry Cloud Cheesecake', 'slug' => 'berry-cloud-cheesecake', 'category' => 'cheesecakes', 'subcategory' => 'chilled-cheesecakes', 'short_description' => 'Mixed berries · Vanilla cream', 'description' => 'A chilled berry cheesecake with a glossy fruit crown and feather-light finish.', 'base_price' => 50, 'image_slot' => 'sprite-2', 'is_featured' => false, 'occasions' => ['anniversary', 'baby-shower'], 'styles' => ['cheesecake'], 'flavors' => ['mixed-berries', 'vanilla'], 'allergens' => ['dairy', 'gluten'], 'badges' => ['seasonal'], 'servings' => [['Classic', 50, 8, 10], ['Grand', 76, 14, 18]]],
            ['name' => 'Lemon Drizzle Loaf', 'slug' => 'lemon-drizzle-loaf', 'category' => 'tea-cakes', 'subcategory' => 'loaf-cakes', 'short_description' => 'Fresh lemon · Vanilla glaze', 'description' => 'A tender lemon loaf with sharp citrus syrup and a fine vanilla glaze.', 'base_price' => 18, 'image_slot' => 'sprite-6', 'is_featured' => false, 'occasions' => ['family-visit', 'just-because'], 'styles' => ['loaf-cake'], 'flavors' => ['lemon', 'vanilla'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => [], 'servings' => [['Loaf', 18, 6, 8], ['Double loaf', 34, 12, 16]]],
            ['name' => 'Coffee Caramel Bundt', 'slug' => 'coffee-caramel-bundt', 'category' => 'tea-cakes', 'subcategory' => 'bundt-cakes', 'short_description' => 'Espresso · Burnt caramel', 'description' => 'A moist coffee bundt finished with glossy caramel and roasted crumbs.', 'base_price' => 22, 'image_slot' => 'sprite-4', 'is_featured' => false, 'occasions' => ['family-visit', 'dinner-party'], 'styles' => ['loaf-cake'], 'flavors' => ['coffee', 'caramel'], 'allergens' => ['dairy', 'eggs', 'gluten', 'coffee-caffeine'], 'badges' => [], 'servings' => [['Classic', 22, 8, 10], ['Large', 36, 14, 16]]],
            ['name' => 'Chocolate Chunk Cookies', 'slug' => 'chocolate-chunk-cookies', 'category' => 'cookies-bites', 'subcategory' => 'cookies', 'short_description' => 'Dark chocolate · Sea salt', 'description' => 'Soft-centred cookies with pools of dark chocolate and a whisper of sea salt.', 'base_price' => 16, 'image_slot' => 'sprite-1', 'is_featured' => false, 'occasions' => ['just-because', 'corporate-event'], 'styles' => ['minimal'], 'flavors' => ['chocolate'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => ['bestseller'], 'servings' => [['Box of six', 16, 3, 6], ['Box of twelve', 29, 6, 12]]],
            ['name' => 'Peanut Praline Cookies', 'slug' => 'peanut-praline-cookies', 'category' => 'cookies-bites', 'subcategory' => 'cookies', 'short_description' => 'Roasted peanut · Milk chocolate', 'description' => 'Soft peanut cookies with crisp praline pieces and milk chocolate.', 'base_price' => 18, 'image_slot' => 'sprite-5', 'is_featured' => false, 'occasions' => ['just-because', 'family-visit'], 'styles' => ['minimal'], 'flavors' => ['chocolate'], 'allergens' => ['peanuts', 'dairy', 'eggs', 'gluten'], 'badges' => [], 'servings' => [['Box of six', 18, 3, 6], ['Box of twelve', 32, 6, 12]]],
            ['name' => 'Fudge Brownie Slab', 'slug' => 'fudge-brownie-slab', 'category' => 'cookies-bites', 'subcategory' => 'brownies-bars', 'short_description' => 'Dark cocoa · Fudge centre', 'description' => 'A deeply fudgy brownie slab that can be finished with a celebration message.', 'base_price' => 28, 'image_slot' => 'sprite-1', 'is_featured' => false, 'occasions' => ['birthday', 'graduation'], 'styles' => ['minimal'], 'flavors' => ['chocolate', 'caramel'], 'allergens' => ['dairy', 'eggs', 'gluten'], 'badges' => [], 'servings' => [['Classic slab', 28, 10, 12], ['Party slab', 52, 20, 24]]],
            ['name' => 'Celebration Hamper', 'slug' => 'celebration-hamper', 'category' => 'gift-collections', 'subcategory' => 'celebration-boxes', 'short_description' => 'Cake · Cookies · Macarons', 'description' => 'A generous mixed bakery hamper designed for milestones and thoughtful gifting.', 'base_price' => 72, 'image_slot' => 'sprite-7', 'is_featured' => true, 'occasions' => ['birthday', 'anniversary', 'holiday'], 'styles' => ['signature'], 'flavors' => ['chocolate', 'vanilla', 'almond'], 'allergens' => ['tree-nuts', 'dairy', 'eggs', 'gluten'], 'badges' => ['gift-favourite'], 'servings' => [['Classic hamper', 72, 8, 12], ['Grand hamper', 118, 16, 24]]],
            ['name' => 'Corporate Dessert Box', 'slug' => 'corporate-dessert-box', 'category' => 'gift-collections', 'subcategory' => 'corporate-gifting', 'short_description' => 'Branded bites · 24 pieces', 'description' => 'A polished selection of branded petit desserts for meetings, launches and teams.', 'base_price' => 95, 'image_slot' => 'sprite-7', 'is_featured' => false, 'occasions' => ['corporate-event'], 'styles' => ['signature', 'minimal'], 'flavors' => ['chocolate', 'lemon', 'coffee'], 'allergens' => ['tree-nuts', 'dairy', 'eggs', 'gluten', 'coffee-caffeine'], 'badges' => ['chefs-pick'], 'servings' => [['Twenty-four pieces', 95, 18, 24], ['Forty-eight pieces', 178, 36, 48]]],
            ['name' => 'Flourless Almond Cake', 'slug' => 'flourless-almond-cake', 'category' => 'dietary-collection', 'subcategory' => 'gluten-smart', 'short_description' => 'Almond · Citrus · Olive oil', 'description' => 'A naturally flourless almond cake with citrus perfume and a delicate crumb.', 'base_price' => 44, 'image_slot' => 'sprite-3', 'is_featured' => false, 'occasions' => ['family-visit', 'dinner-party'], 'styles' => ['minimal'], 'flavors' => ['almond', 'lemon'], 'allergens' => ['tree-nuts', 'eggs'], 'badges' => ['new'], 'servings' => [['Classic', 44, 8, 10], ['Grand', 68, 14, 18]]],
            ['name' => 'Vegan Chocolate Garden', 'slug' => 'vegan-chocolate-garden', 'category' => 'dietary-collection', 'subcategory' => 'vegan-selection', 'short_description' => 'Dark chocolate · Coconut cream', 'description' => 'A plant-based chocolate layer cake finished with coconut ganache and seasonal petals.', 'base_price' => 42, 'image_slot' => 'sprite-1', 'is_featured' => false, 'occasions' => ['birthday', 'just-because'], 'styles' => ['layer-cake', 'floral'], 'flavors' => ['chocolate', 'coconut'], 'allergens' => ['soy', 'gluten'], 'badges' => ['new'], 'servings' => [['Classic', 42, 8, 10], ['Grand', 66, 14, 18]]],
            ['name' => 'Rosemary Sea Salt Focaccia', 'slug' => 'rosemary-sea-salt-focaccia', 'category' => 'artisan-bread', 'subcategory' => 'focaccia', 'short_description' => 'Olive oil · Rosemary · Sea salt', 'description' => 'Airy long-fermented focaccia with a crisp olive-oil crust.', 'base_price' => 12, 'image_slot' => 'sprite-8', 'is_featured' => false, 'occasions' => ['dinner-party', 'family-visit'], 'styles' => ['minimal'], 'flavors' => [], 'allergens' => ['gluten'], 'badges' => [], 'servings' => [['Half tray', 12, 4, 6], ['Full tray', 22, 10, 12]]],
            ['name' => 'Hazelnut Mirror Entremet', 'slug' => 'hazelnut-mirror-entremet', 'category' => 'signature-cakes', 'subcategory' => 'modern-classics', 'short_description' => 'Hazelnut · Chocolate · Praline', 'description' => 'A precise modern entremet with hazelnut mousse, chocolate crémeux and praline crunch.', 'base_price' => 68, 'image_slot' => 'sprite-3', 'is_featured' => true, 'occasions' => ['anniversary', 'dinner-party'], 'styles' => ['signature', 'minimal'], 'flavors' => ['hazelnut', 'chocolate'], 'allergens' => ['tree-nuts', 'dairy', 'eggs', 'gluten'], 'badges' => ['chefs-pick'], 'servings' => [['Classic', 68, 8, 10], ['Grand', 98, 14, 18]]],
        ];

        foreach ($products as $index => $data) {
            $product = Product::updateOrCreate(['slug' => $data['slug']], [
                ...collect($data)->except(['category', 'subcategory', 'occasions', 'styles', 'flavors', 'allergens', 'badges', 'servings'])->all(),
                'category_id' => $categories[$data['category']],
                'subcategory_id' => $subcategories[$data['subcategory']],
                'badge' => null,
                'allergens' => null,
                'is_active' => true,
                'sort_order' => $index + 1,
            ]);
            $product->variants()->delete();
            $product->variants()->createMany(collect($data['servings'])->map(fn ($serving) => [
                'name' => $serving[0], 'price' => $serving[1], 'serves' => $serving[2].'–'.$serving[3].' guests',
                'serves_min' => $serving[2], 'serves_max' => $serving[3], 'is_active' => true,
            ])->all());
            $product->occasions()->sync(collect($data['occasions'])->map(fn ($slug) => $occasions[$slug])->all());
            $product->styles()->sync(collect($data['styles'])->map(fn ($slug) => $styles[$slug])->all());
            $product->flavors()->sync(collect($data['flavors'])->map(fn ($slug) => $flavors[$slug])->all());
            $product->allergens()->sync(collect($data['allergens'])->map(fn ($slug) => $allergens[$slug])->all());
            $product->badges()->sync(collect($data['badges'])->map(fn ($slug) => $badges[$slug])->all());
        }

        if (app()->environment(['local', 'testing'])) {
            $productIds = Product::pluck('id', 'slug');
            $demoInquiries = [
                ['reference' => 'MMC-DEMO-001', 'customer_name' => 'Ayesha Khan', 'phone' => '0301 245 8890', 'email' => 'ayesha@example.com', 'event_date' => '2026-09-05', 'event_type' => 'Birthday', 'fulfilment' => 'pickup', 'status' => 'new', 'estimated_total' => 48, 'product' => 'midnight-truffle', 'variant' => 'Classic', 'quantity' => 1, 'notes' => 'Please add “Happy 30th, Zara” in gold lettering.'],
                ['reference' => 'MMC-DEMO-002', 'customer_name' => 'Hamza Siddiqui', 'phone' => '0322 718 4421', 'email' => 'hamza@example.com', 'event_date' => '2026-09-12', 'event_type' => 'Anniversary', 'fulfilment' => 'delivery', 'status' => 'contacted', 'estimated_total' => 78, 'product' => 'strawberry-chantilly', 'variant' => 'Grand', 'quantity' => 1, 'notes' => 'Soft ivory finish with fresh strawberries.'],
                ['reference' => 'MMC-DEMO-003', 'customer_name' => 'Sana Ahmed', 'phone' => '0334 906 1138', 'email' => 'sana@example.com', 'event_date' => '2026-10-02', 'event_type' => 'Wedding', 'fulfilment' => 'delivery', 'status' => 'new', 'estimated_total' => 0, 'product' => null, 'variant' => null, 'quantity' => 1, 'notes' => 'Three-tier ivory and sage cake for approximately 90 guests.'],
                ['reference' => 'MMC-DEMO-004', 'customer_name' => 'Bilal Raza', 'phone' => '0300 662 7845', 'email' => null, 'event_date' => '2026-09-01', 'event_type' => 'Dinner Party', 'fulfilment' => 'pickup', 'status' => 'quoted', 'estimated_total' => 76, 'product' => 'classic-tiramisu', 'variant' => 'Classic', 'quantity' => 2, 'notes' => 'Two trays, both without decorative message.'],
                ['reference' => 'MMC-DEMO-005', 'customer_name' => 'Mariam Iqbal', 'phone' => '0315 440 1928', 'email' => 'mariam@example.com', 'event_date' => '2026-09-08', 'event_type' => 'Corporate Event', 'fulfilment' => 'delivery', 'status' => 'confirmed', 'estimated_total' => 72, 'product' => 'parisian-macarons', 'variant' => 'Twelve piece box', 'quantity' => 3, 'notes' => 'Assorted neutral colours for an office reception.'],
            ];

            foreach ($demoInquiries as $demo) {
                $product = $demo['product'] ? Product::with('variants')->find($productIds[$demo['product']]) : null;
                $variant = $product?->variants->firstWhere('name', $demo['variant']);
                $inquiry = Inquiry::updateOrCreate(['reference' => $demo['reference']], [
                    ...collect($demo)->except(['product', 'variant', 'quantity', 'notes'])->all(),
                    'address' => $demo['fulfilment'] === 'delivery' ? 'Lahore, Punjab' : null,
                    'customer_notes' => $demo['notes'],
                ]);
                $inquiry->items()->delete();
                $inquiry->items()->create([
                    'product_id' => $product?->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $product?->name ?? 'Custom Wedding Cake',
                    'variant_name' => $variant?->name,
                    'quantity' => $demo['quantity'],
                    'unit_price' => $product ? (float) ($variant?->price ?? $product->base_price) : 0,
                    'notes' => $demo['notes'],
                    'custom_details' => $product ? null : ['guests' => '90', 'style' => 'Three-tier', 'colours' => 'Ivory and sage'],
                ]);
            }
        }

        DB::table('settings')->updateOrInsert(['key' => 'bakery_name'], ['value' => 'Sweet Boutique', 'created_at' => now(), 'updated_at' => now()]);
    }
}

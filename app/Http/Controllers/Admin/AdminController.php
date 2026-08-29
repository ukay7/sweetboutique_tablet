<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Allergen;
use App\Models\Badge;
use App\Models\CakeStyle;
use App\Models\Category;
use App\Models\Flavor;
use App\Models\Inquiry;
use App\Models\Occasion;
use App\Models\Product;
use App\Models\Subcategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $products = Product::with($this->productRelations())->orderByDesc('created_at')->paginate(24, ['*'], 'product_page');
        $inquiries = Inquiry::with('items')->latest()->paginate(25, ['*'], 'inquiry_page');

        return response()->json([
            'current_user' => $request->user()?->load('role:id,name,slug,menu_items'),
            'stats' => [
                'new_inquiries' => Inquiry::where('status', 'new')->count(),
                'active_quotes' => Inquiry::whereIn('status', ['contacted', 'quoted'])->count(),
                'confirmed' => Inquiry::where('status', 'confirmed')->count(),
                'products' => Product::count(),
                'inquiries' => Inquiry::count(),
            ],
            'categories' => Category::with('subcategories')->orderBy('sort_order')->get(),
            'products' => $products->items(),
            'product_pagination' => $this->pagination($products),
            'inquiries' => $inquiries->items(),
            'inquiry_pagination' => $this->pagination($inquiries),
            'occasions' => Occasion::query()->withCount('products')->orderBy('sort_order')->get(),
            'styles' => CakeStyle::query()->withCount('products')->orderBy('sort_order')->get(),
            'flavors' => Flavor::query()->withCount('products')->orderBy('sort_order')->get(),
            'allergens' => Allergen::query()->withCount('products')->orderBy('sort_order')->get(),
            'badges' => Badge::query()->withCount('products')->orderBy('sort_order')->get(),
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with($this->productRelations())
            ->when(trim((string) $request->query('q')), function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('short_description', 'like', "%{$search}%")
                        ->orWhereHas('category', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy($this->productSort($request), $this->sortDirection($request))
            ->paginate(min(max($request->integer('per_page', 24), 1), 48));

        return response()->json(['products' => $products->items(), 'pagination' => $this->pagination($products)]);
    }

    public function inquiries(Request $request): JsonResponse
    {
        $inquiries = Inquiry::query()
            ->with('items')
            ->when(trim((string) $request->query('q')), function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('reference', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy($this->inquirySort($request), $this->sortDirection($request))
            ->paginate(min(max($request->integer('per_page', 25), 1), 50));

        return response()->json(['inquiries' => $inquiries->items(), 'pagination' => $this->pagination($inquiries)]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $this->validateCategory($request);
        $category = Category::create([...$data, 'slug' => $this->uniqueSlug(Category::class, $data['name'])]);

        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        $data = $this->validateCategory($request);
        $category->update([...$data, 'slug' => $this->uniqueSlug(Category::class, $data['name'], $category->id)]);

        return response()->json($category->fresh('subcategories'));
    }

    public function destroyCategory(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json(['message' => 'Move or remove this category’s products first.'], 422);
        }
        $category->delete();

        return response()->json(['message' => 'Category removed.']);
    }

    public function storeSubcategory(Request $request): JsonResponse
    {
        $data = $this->validateSubcategory($request);
        $subcategory = Subcategory::create([...$data, 'slug' => Str::slug($data['name'])]);

        return response()->json($subcategory, 201);
    }

    public function updateSubcategory(Request $request, Subcategory $subcategory): JsonResponse
    {
        $data = $this->validateSubcategory($request);
        $subcategory->update([...$data, 'slug' => Str::slug($data['name'])]);

        return response()->json($subcategory);
    }

    public function destroySubcategory(Subcategory $subcategory): JsonResponse
    {
        if ($subcategory->products()->exists()) {
            return response()->json(['message' => 'Move this subcategory’s products first.'], 422);
        }
        $subcategory->delete();

        return response()->json(['message' => 'Subcategory removed.']);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $data = $this->validateProduct($request);
        $product = DB::transaction(function () use ($data) {
            $variants = $data['variants'] ?? [];
            $relations = $this->pullProductRelations($data);
            unset($data['variants']);
            $product = Product::create([...$data, 'slug' => $this->uniqueSlug(Product::class, $data['name'])]);
            $product->variants()->createMany($variants);
            $this->syncProductRelations($product, $relations);

            return $product;
        });

        return response()->json($product->load($this->productRelations()), 201);
    }

    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        $data = $this->validateProduct($request);
        DB::transaction(function () use ($data, $product) {
            $variants = $data['variants'] ?? [];
            $relations = $this->pullProductRelations($data);
            unset($data['variants']);
            $product->update([...$data, 'slug' => $this->uniqueSlug(Product::class, $data['name'], $product->id)]);
            $product->variants()->delete();
            $product->variants()->createMany($variants);
            $this->syncProductRelations($product, $relations);
        });

        return response()->json($product->fresh($this->productRelations()));
    }

    public function destroyProduct(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Product removed.']);
    }

    public function updateInquiry(Request $request, Inquiry $inquiry): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['new', 'contacted', 'quoted', 'confirmed', 'cancelled'])],
            'internal_notes' => ['nullable', 'string', 'max:3000'],
        ]);
        $inquiry->update($data);

        return response()->json($inquiry->fresh('items'));
    }

    private function validateCategory(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:40'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function validateSubcategory(Request $request): array
    {
        return $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function validateProduct(Request $request): array
    {
        return $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'subcategory_id' => ['nullable', 'exists:subcategories,id'],
            'name' => ['required', 'string', 'max:160'],
            'short_description' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'preparation_hours' => ['required', 'integer', 'min:1', 'max:8760'],
            'image_slot' => ['required', 'string', Rule::in(['sprite-1', 'sprite-2', 'sprite-3', 'sprite-4', 'sprite-5', 'sprite-6', 'sprite-7', 'sprite-8'])],
            'image_url' => ['nullable', 'string', 'max:500'],
            'is_featured' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['required', 'string', 'max:80'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.serves' => ['nullable', 'string', 'max:80'],
            'variants.*.serves_min' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'variants.*.serves_max' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'variants.*.is_active' => ['required', 'boolean'],
            'occasion_ids' => ['array'],
            'occasion_ids.*' => ['integer', 'exists:occasions,id'],
            'style_ids' => ['array'],
            'style_ids.*' => ['integer', 'exists:cake_styles,id'],
            'flavor_ids' => ['array'],
            'flavor_ids.*' => ['integer', 'exists:flavors,id'],
            'allergen_ids' => ['array'],
            'allergen_ids.*' => ['integer', 'exists:allergens,id'],
            'badge_ids' => ['array'],
            'badge_ids.*' => ['integer', 'exists:badges,id'],
        ]);
    }

    /** @return array<int, string> */
    private function productRelations(): array
    {
        return [
            'category:id,name', 'subcategory:id,name', 'variants', 'occasions:id,name,slug',
            'styles:id,name,slug', 'flavors:id,name,slug', 'allergens:id,name,slug', 'badges:id,name,slug,tone',
        ];
    }

    /** @param array<string, mixed> $data
     * @return array<string, array<int, int>>
     */
    private function pullProductRelations(array &$data): array
    {
        $relations = [];
        foreach (['occasion_ids', 'style_ids', 'flavor_ids', 'allergen_ids', 'badge_ids'] as $key) {
            $relations[$key] = array_values($data[$key] ?? []);
            unset($data[$key]);
        }

        return $relations;
    }

    /** @param array<string, array<int, int>> $relations */
    private function syncProductRelations(Product $product, array $relations): void
    {
        $product->occasions()->sync($relations['occasion_ids']);
        $product->styles()->sync($relations['style_ids']);
        $product->flavors()->sync($relations['flavor_ids']);
        $product->allergens()->sync($relations['allergen_ids']);
        $product->badges()->sync($relations['badge_ids']);
    }

    private function productSort(Request $request): string
    {
        return match ($request->query('sort')) {
            'name' => 'name',
            'price' => 'base_price',
            'status' => 'is_active',
            default => 'created_at',
        };
    }

    private function inquirySort(Request $request): string
    {
        return match ($request->query('sort')) {
            'reference' => 'reference',
            'customer' => 'customer_name',
            'event_date' => 'event_date',
            'status' => 'status',
            'total' => 'estimated_total',
            default => 'created_at',
        };
    }

    private function sortDirection(Request $request): string
    {
        return $request->query('direction') === 'asc' ? 'asc' : 'desc';
    }

    private function uniqueSlug(string $model, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;
        while ($model::where('slug', $slug)->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }

    /** @return array<string, int|bool> */
    private function pagination(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'has_more' => $paginator->hasMorePages(),
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Allergen;
use App\Models\Badge;
use App\Models\CakeStyle;
use App\Models\Category;
use App\Models\Flavor;
use App\Models\Occasion;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 12), 1), 24);
        $products = Product::query()
            ->where('is_active', true)
            ->with([
                'category:id,name,slug',
                'subcategory:id,name,slug',
                'variants' => fn ($query) => $query->where('is_active', true)->orderBy('price'),
                'occasions:id,name,slug',
                'styles:id,name,slug',
                'flavors:id,name,slug',
                'allergens:id,name,slug',
                'badges:id,name,slug,tone',
            ]);

        if ($search = trim((string) $request->query('q'))) {
            $products->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('flavors', fn ($query) => $query->where('name', 'like', "%{$search}%"));
            });
        }

        $products->when($request->integer('category_id'), fn ($query, $categoryId) => $query->where('category_id', $categoryId));
        $products->when($request->integer('subcategory_id'), fn ($query, $subcategoryId) => $query->where('subcategory_id', $subcategoryId));
        $products->when($request->integer('occasion_id'), fn ($query, $occasionId) => $query->whereHas('occasions', fn ($query) => $query->whereKey($occasionId)));
        $products->when($request->integer('style_id'), fn ($query, $styleId) => $query->whereHas('styles', fn ($query) => $query->whereKey($styleId)));

        if ($guests = $request->integer('guests')) {
            $products->whereHas('variants', function ($query) use ($guests) {
                $query->where('is_active', true)->whereNotNull('serves_max')->where('serves_max', '>=', $guests);
            });
        }

        $lovedFlavorIds = $this->ids($request->query('flavor_ids'));
        if ($lovedFlavorIds !== []) {
            $products->whereHas('flavors', fn ($query) => $query->whereIn('flavors.id', $lovedFlavorIds));
        }

        $avoidedFlavorIds = $this->ids($request->query('avoid_flavor_ids'));
        if ($avoidedFlavorIds !== []) {
            $products->whereDoesntHave('flavors', fn ($query) => $query->whereIn('flavors.id', $avoidedFlavorIds));
        }

        $excludedAllergenIds = $this->ids($request->query('allergen_ids'));
        if ($excludedAllergenIds !== []) {
            $products->whereDoesntHave('allergens', fn ($query) => $query->whereIn('allergens.id', $excludedAllergenIds));
        }

        if ($request->boolean('gluten_free')) {
            $products->whereDoesntHave('allergens', fn ($query) => $query->where('slug', 'gluten'));
        }

        match ($request->query('budget')) {
            'under-50' => $products->where('base_price', '<', 50),
            '50-100' => $products->whereBetween('base_price', [50, 100]),
            '100-150' => $products->whereBetween('base_price', [100, 150]),
            '150-plus' => $products->where('base_price', '>=', 150),
            default => null,
        };

        $paginator = $products->orderByDesc('is_featured')->orderBy('sort_order')->paginate($perPage);

        return response()->json([
            'categories' => Category::query()
                ->where('is_active', true)
                ->with(['subcategories' => fn ($query) => $query->where('is_active', true)])
                ->orderBy('sort_order')
                ->get(),
            'occasions' => Occasion::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'styles' => CakeStyle::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'flavors' => Flavor::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'allergens' => Allergen::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'badges' => Badge::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'products' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    /** @return array<int, int> */
    private function ids(mixed $value): array
    {
        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        return collect(explode(',', $value))
            ->map(fn ($id) => filter_var(trim($id), FILTER_VALIDATE_INT))
            ->filter(fn ($id) => is_int($id) && $id > 0)
            ->unique()
            ->values()
            ->all();
    }
}

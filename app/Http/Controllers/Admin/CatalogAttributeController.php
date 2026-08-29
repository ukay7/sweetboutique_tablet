<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Allergen;
use App\Models\Badge;
use App\Models\CakeStyle;
use App\Models\Flavor;
use App\Models\Occasion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CatalogAttributeController extends Controller
{
    /** @var array<string, class-string<Model>> */
    private const TYPES = [
        'occasions' => Occasion::class,
        'styles' => CakeStyle::class,
        'flavors' => Flavor::class,
        'allergens' => Allergen::class,
        'badges' => Badge::class,
    ];

    public function index(string $type): JsonResponse
    {
        $model = $this->modelFor($type);

        return response()->json(['items' => $model::query()->withCount('products')->orderBy('sort_order')->orderBy('name')->get()]);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $model = $this->modelFor($type);
        $data = $this->validated($request, $type);
        $item = $model::query()->create([...$data, 'slug' => $this->uniqueSlug($model, $data['name'])]);

        return response()->json($item->loadCount('products'), 201);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $model = $this->modelFor($type);
        $item = $model::query()->findOrFail($id);
        $data = $this->validated($request, $type);
        $item->update([...$data, 'slug' => $this->uniqueSlug($model, $data['name'], $item->getKey())]);

        return response()->json($item->fresh()->loadCount('products'));
    }

    public function destroy(string $type, int $id): JsonResponse
    {
        $model = $this->modelFor($type);
        $item = $model::query()->findOrFail($id);
        if ($item->products()->exists()) {
            return response()->json(['message' => 'Remove this attribute from its products before deleting it.'], 422);
        }
        $item->delete();

        return response()->json(['message' => 'Attribute removed.']);
    }

    /** @return class-string<Model> */
    private function modelFor(string $type): string
    {
        abort_unless(isset(self::TYPES[$type]), 404);

        return self::TYPES[$type];
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, string $type): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'tone' => [$type === 'badges' ? 'nullable' : 'exclude', 'string', 'max:30'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    /** @param class-string<Model> $model */
    private function uniqueSlug(string $model, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;
        while ($model::query()->where('slug', $slug)->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}

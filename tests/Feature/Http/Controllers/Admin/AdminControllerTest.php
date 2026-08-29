<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AdminControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_create_product_with_dynamic_preparation_time(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $category = $this->createCategory();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', $this->productPayload($category, 72));

        $response
            ->assertCreated()
            ->assertJsonPath('preparation_hours', 72);

        $this->assertDatabaseHas('products', [
            'name' => 'Lead Time Cake',
            'preparation_hours' => 72,
        ]);
    }

    public function test_admin_can_update_product_preparation_time(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $category = $this->createCategory();
        $product = Product::create([
            ...$this->productPayload($category, 48),
            'slug' => 'lead-time-cake',
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/products/{$product->id}", $this->productPayload($category, 120));

        $response
            ->assertOk()
            ->assertJsonPath('preparation_hours', 120);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'preparation_hours' => 120,
        ]);
    }

    public function test_returns_422_when_preparation_time_is_less_than_one_hour(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $category = $this->createCategory();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', $this->productPayload($category, 0));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['preparation_hours'])
            ->assertJsonPath('errors.preparation_hours.0', 'The preparation hours field must be at least 1.');
    }

    public function test_catalog_returns_product_preparation_time(): void
    {
        $category = $this->createCategory();
        Product::create([
            ...$this->productPayload($category, 96),
            'slug' => 'lead-time-cake',
        ]);

        $response = $this->getJson('/api/catalog?q=Lead%20Time%20Cake');

        $response
            ->assertOk()
            ->assertJsonPath('products.0.preparation_hours', 96);
    }

    private function createCategory(): Category
    {
        return Category::create([
            'name' => 'Test Cakes',
            'slug' => 'test-cakes',
            'description' => 'Products created by this test.',
            'icon' => 'cake',
            'sort_order' => 1,
            'is_active' => true,
        ]);
    }

    /** @return array<string, mixed> */
    private function productPayload(Category $category, int $preparationHours): array
    {
        return [
            'category_id' => $category->id,
            'subcategory_id' => null,
            'name' => 'Lead Time Cake',
            'short_description' => 'A product with dynamic preparation time.',
            'description' => 'Prepared specifically for the requested lead time.',
            'base_price' => 65,
            'preparation_hours' => $preparationHours,
            'image_slot' => 'sprite-1',
            'image_url' => null,
            'is_featured' => false,
            'is_active' => true,
            'sort_order' => 1,
            'variants' => [],
            'occasion_ids' => [],
            'style_ids' => [],
            'flavor_ids' => [],
            'allergen_ids' => [],
            'badge_ids' => [],
        ];
    }
}

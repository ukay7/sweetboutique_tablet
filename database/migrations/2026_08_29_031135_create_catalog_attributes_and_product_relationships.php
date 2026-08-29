<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (['occasions', 'cake_styles', 'flavors', 'allergens', 'badges'] as $tableName) {
            Schema::create($tableName, function (Blueprint $table) use ($tableName) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('description')->nullable();
                if ($tableName === 'badges') {
                    $table->string('tone')->nullable();
                }
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index(['is_active', 'sort_order']);
            });
        }

        Schema::create('occasion_product', function (Blueprint $table) {
            $table->foreignId('occasion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['occasion_id', 'product_id']);
        });

        Schema::create('cake_style_product', function (Blueprint $table) {
            $table->foreignId('cake_style_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['cake_style_id', 'product_id']);
        });

        Schema::create('flavor_product', function (Blueprint $table) {
            $table->foreignId('flavor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['flavor_id', 'product_id']);
        });

        Schema::create('allergen_product', function (Blueprint $table) {
            $table->foreignId('allergen_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['allergen_id', 'product_id']);
        });

        Schema::create('badge_product', function (Blueprint $table) {
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['badge_id', 'product_id']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->unsignedSmallInteger('serves_min')->nullable()->after('serves');
            $table->unsignedSmallInteger('serves_max')->nullable()->after('serves_min');
            $table->index(['is_active', 'serves_max']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['is_active', 'is_featured', 'sort_order'], 'products_catalog_order_index');
            $table->index(['is_active', 'base_price'], 'products_catalog_price_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_catalog_order_index');
            $table->dropIndex('products_catalog_price_index');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex(['is_active', 'serves_max']);
            $table->dropColumn(['serves_min', 'serves_max']);
        });

        Schema::dropIfExists('badge_product');
        Schema::dropIfExists('allergen_product');
        Schema::dropIfExists('flavor_product');
        Schema::dropIfExists('cake_style_product');
        Schema::dropIfExists('occasion_product');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('allergens');
        Schema::dropIfExists('flavors');
        Schema::dropIfExists('cake_styles');
        Schema::dropIfExists('occasions');
    }
};

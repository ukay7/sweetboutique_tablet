<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CatalogAttributeController;
use App\Http\Controllers\Admin\ProductImageController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\InquiryController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('BakeryApp');
});

Route::get('/staff-login', fn () => Inertia::render('StaffPortal'));

Route::prefix('api')->group(function () {
    Route::get('/catalog', [CatalogController::class, 'index']);
    Route::post('/inquiries', [InquiryController::class, 'store']);

    Route::prefix('admin')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware('admin')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/products', [AdminController::class, 'products']);
            Route::get('/inquiries', [AdminController::class, 'inquiries']);

            Route::post('/categories', [AdminController::class, 'storeCategory']);
            Route::put('/categories/{category}', [AdminController::class, 'updateCategory']);
            Route::delete('/categories/{category}', [AdminController::class, 'destroyCategory']);

            Route::post('/subcategories', [AdminController::class, 'storeSubcategory']);
            Route::put('/subcategories/{subcategory}', [AdminController::class, 'updateSubcategory']);
            Route::delete('/subcategories/{subcategory}', [AdminController::class, 'destroySubcategory']);

            Route::post('/products', [AdminController::class, 'storeProduct']);
            Route::put('/products/{product}', [AdminController::class, 'updateProduct']);
            Route::delete('/products/{product}', [AdminController::class, 'destroyProduct']);
            Route::post('/product-images', ProductImageController::class);

            Route::get('/attributes/{type}', [CatalogAttributeController::class, 'index']);
            Route::post('/attributes/{type}', [CatalogAttributeController::class, 'store']);
            Route::put('/attributes/{type}/{id}', [CatalogAttributeController::class, 'update']);
            Route::delete('/attributes/{type}/{id}', [CatalogAttributeController::class, 'destroy']);

            Route::put('/inquiries/{inquiry}', [AdminController::class, 'updateInquiry']);

            Route::get('/settings', [SettingsController::class, 'index']);
            Route::post('/roles', [SettingsController::class, 'storeRole']);
            Route::put('/roles/{role}', [SettingsController::class, 'updateRole']);
            Route::delete('/roles/{role}', [SettingsController::class, 'destroyRole']);
            Route::post('/users', [SettingsController::class, 'storeUser']);
            Route::put('/users/{user}', [SettingsController::class, 'updateUser']);
            Route::delete('/users/{user}', [SettingsController::class, 'destroyUser']);
        });
    });
});

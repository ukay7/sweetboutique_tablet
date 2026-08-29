<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $fillable = ['product_id', 'name', 'price', 'serves', 'serves_min', 'serves_max', 'is_active'];

    protected $casts = ['price' => 'decimal:2', 'serves_min' => 'integer', 'serves_max' => 'integer', 'is_active' => 'boolean'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

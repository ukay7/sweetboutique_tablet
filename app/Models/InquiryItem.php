<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InquiryItem extends Model
{
    protected $fillable = [
        'inquiry_id', 'product_id', 'product_variant_id', 'product_name', 'variant_name',
        'quantity', 'unit_price', 'notes', 'custom_details',
    ];

    protected $casts = ['unit_price' => 'decimal:2', 'custom_details' => 'array'];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class);
    }
}

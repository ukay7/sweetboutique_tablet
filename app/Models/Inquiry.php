<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inquiry extends Model
{
    protected $fillable = [
        'reference', 'customer_name', 'phone', 'email', 'event_date', 'event_type', 'fulfilment',
        'address', 'customer_notes', 'internal_notes', 'status', 'estimated_total',
    ];

    protected $casts = ['event_date' => 'date:Y-m-d', 'estimated_total' => 'decimal:2'];

    public function items(): HasMany
    {
        return $this->hasMany(InquiryItem::class);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InquiryController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:160'],
            'event_date' => ['nullable', 'date', 'after_or_equal:today'],
            'event_type' => ['nullable', 'string', 'max:100'],
            'fulfilment' => ['required', 'in:pickup,delivery'],
            'address' => ['nullable', 'string', 'max:255'],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
            'items.*.custom_details' => ['nullable', 'array'],
        ]);

        $inquiry = DB::transaction(function () use ($validated) {
            $reference = 'MMC-'.now()->format('ymd').'-'.Str::upper(Str::random(5));
            $total = 0;
            $resolvedItems = [];

            foreach ($validated['items'] as $item) {
                $product = isset($item['product_id']) ? Product::with('variants')->find($item['product_id']) : null;
                $variant = $product && isset($item['variant_id']) ? $product->variants->firstWhere('id', $item['variant_id']) : null;
                $unitPrice = $variant ? (float) $variant->price : (float) ($product?->base_price ?? 0);
                $total += $unitPrice * $item['quantity'];
                $resolvedItems[] = compact('item', 'product', 'variant', 'unitPrice');
            }

            $inquiry = Inquiry::create([
                ...collect($validated)->except('items')->all(),
                'reference' => $reference,
                'estimated_total' => $total,
            ]);

            foreach ($resolvedItems as $resolved) {
                $item = $resolved['item'];
                $inquiry->items()->create([
                    'product_id' => $resolved['product']?->id,
                    'product_variant_id' => $resolved['variant']?->id,
                    'product_name' => $resolved['product']?->name ?? 'Custom Cake Request',
                    'variant_name' => $resolved['variant']?->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $resolved['unitPrice'],
                    'notes' => $item['notes'] ?? null,
                    'custom_details' => $item['custom_details'] ?? null,
                ]);
            }

            return $inquiry->load('items');
        });

        return response()->json([
            'message' => 'Your inquiry has been received.',
            'inquiry' => $inquiry,
        ], 201);
    }
}

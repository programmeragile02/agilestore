<?php

namespace App\Services;

use App\Models\MstDuration;
use App\Models\MstProductPricelistItem;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class PricingService
{
    public function resolvePrice(string $productCode, string $packageCode, string $durationCode): array
    {
        $now = Carbon::now();

        $duration = MstDuration::where('code', $durationCode)->first();
        if (!$duration) {
            throw ValidationException::withMessages([
                'duration_code' => ["Durasi tidak valid: {$durationCode}"],
            ]);
        }

        $item = MstProductPricelistItem::query()
            ->whereHas('header', function ($q) use ($productCode) {
                $q->where('product_code', $productCode);
            })
            ->where('package_code', $packageCode)
            ->where('duration_id', $duration->id)
            ->where(function ($q) use ($now) {
                $q->whereNull('effective_start')->orWhere('effective_start', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('effective_end')->orWhere('effective_end', '>=', $now);
            })
            ->orderByDesc('effective_start')
            ->first();
        
        if (!$item) {
            throw ValidationException::withMessages([
                'pricing' => "Harga tidak ditemukan untuk kombinasi ($productCode / $packageCode / $durationCode).",
            ]);
        }

        $price    = (float) $item->price;
        $discount = (float) $item->discount;
        $total    = max(0, $price - $discount);
        $currency = optional($item->header)->currency ?: 'IDR';

        return [
            'pricelist_item_id' => $item->id,
            'price'             => $price,
            'discount'          => $discount,
            'total'             => $total,
            'currency'          => $currency,
        ];
    }
}
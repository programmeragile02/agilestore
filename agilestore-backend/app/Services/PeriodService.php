<?php

namespace App\Services;

use App\Models\Order;
use App\Models\MstDuration;
use Illuminate\Support\Carbon;

class PeriodService
{
    /**
     * @param 'purchase'|'renew'|'upgrade' $intent
     * @return array{start_date: Carbon, end_date: Carbon}
     */
    public function compute(
        string $intent,
        ?Order $baseOrder,
        MstDuration $duration,
        ?Carbon $overrideStart = null,
        ?Carbon $overrideEnd   = null
    ): array {
        $today = now()->startOfDay();

        $start = $today->copy();
        $end   = null;

        if ($intent === 'renew' || $intent === 'upgrade') {
            // START: max(base.end+1, today)
            if ($baseOrder && $baseOrder->end_date instanceof Carbon && $baseOrder->end_date->gte($today)) {
                $start = $baseOrder->end_date->copy()->addDay()->startOfDay();
            }
            $end = $this->calcEndInclusive($start, $duration);
        } else { // purchase
            $start = $today->copy();
            $end   = $this->calcEndInclusive($start, $duration);
        }

        if ($overrideStart) $start = $overrideStart->copy()->startOfDay();
        if ($overrideEnd)   $end   = $overrideEnd->copy()->endOfDay();

        return ['start_date' => $start, 'end_date' => $end];
    }

    private function calcEndInclusive(Carbon $start, MstDuration $duration): Carbon
    {
        $length = (int) $duration->length;
        $unit   = strtolower((string) $duration->unit);

        if (in_array($unit, ['month','months'], true)) {
            return $start->copy()->addMonthsNoOverflow($length)->subDay()->endOfDay();
        }
        if (in_array($unit, ['day','days'], true)) {
            return $start->copy()->addDays($length)->subDay()->endOfDay();
        }
        return $start->copy()->addMonthsNoOverflow($length)->subDay()->endOfDay();
    }

    // helper opsional
    public static function isActiveAt(Carbon $start, Carbon $end, ?Carbon $at = null): bool
    {
        $at = ($at ?: now())->startOfDay();
        return $at->betweenIncluded($start->copy()->startOfDay(), $end->copy()->startOfDay());
    }
}

// namespace App\Services;

// use App\Models\Order;
// use App\Models\MstDuration;
// use Carbon\Carbon;

// class PeriodService
// {
//     /**
//      * Hitung periode aktif untuk order baru berdasar intent.
//      * - purchase: mulai hari ini
//      * - renew: lanjut dari end_date aktif terakhir (H+1) jika masih aktif; kalau sudah lewat → hari ini
//      * - upgrade: in-place → default pertahankan end_date lama, start_date tetap start lama;
//      *            tapi jika mau override dari FE/BE, sediakan param opsional.
//      */
//     /**
//      * @param 'purchase'|'renew'|'upgrade' $intent
//      * @return array{start_date:string,end_date:string}
//      */
//     public function compute(string $intent, ?Order $baseOrder, MstDuration $duration, ?Carbon $overrideStart = null, ?Carbon $overrideEnd = null): array
//     {
//         $today = now()->startOfDay();

//         // default start/end
//         $start = $today->copy();
//         $end   = null;

//         if ($intent === 'renew') {
//             // Jika base punya end_date dan end_date >= today → lanjut H+1
//             if ($baseOrder && $baseOrder->end_date instanceof Carbon) {
//                 $candidate = $baseOrder->end_date->copy()->addDay()->startOfDay();
//                 $start = $candidate->greaterThan($today) ? $candidate : $today->copy();
//             } else {
//                 $start = $today->copy();
//             }
//             $end = $this->calcEndInclusive($start, $duration);
//         } elseif ($intent === 'upgrade') {
//             // In-place: periode tidak berubah (pakai periode base)
//             if ($baseOrder && $baseOrder->start_date instanceof Carbon && $baseOrder->end_date instanceof Carbon) {
//                 $start = $baseOrder->start_date->copy()->startOfDay();
//                 $end   = $baseOrder->end_date->copy()->endOfDay();
//             } else {
//                 // fallback kalau base tidak lengkap → treat seperti purchase
//                 $start = $today->copy();
//                 $end   = $this->calcEndInclusive($start, $duration);
//             }
//         } else { // purchase
//             $start = $today->copy();
//             $end   = $this->calcEndInclusive($start, $duration);
//         }

//         // override jika disediakan
//         if ($overrideStart) $start = $overrideStart->copy()->startOfDay();
//         if ($overrideEnd)   $end   = $overrideEnd->copy()->endOfDay();

//         return [
//             'start_date' => $start->toDateString(),
//             'end_date'   => $end->toDateString(),
//         ];
//     }

//     private function calcEndInclusive(Carbon $start, MstDuration $duration): Carbon
//     {
//         $length = (int) $duration->length;
//         $unit   = strtolower((string) $duration->unit);

//         if (in_array($unit, ['month', 'months'], true)) {
//             // contoh: start 10 Oct + 1 bulan → 9 Nov (inclusive)
//             return $start->copy()->addMonthsNoOverflow($length)->subDay()->endOfDay();
//         }

//         if (in_array($unit, ['day', 'days'], true)) {
//             return $start->copy()->addDays($length)->subDay()->endOfDay();
//         }

//         // fallback → perlakukan seperti bulan
//         return $start->copy()->addMonthsNoOverflow($length)->subDay()->endOfDay();
//     }

//     /**
//      * Helper opsional: cek aktif untuk tanggal tertentu
//      */
//     public static function isActiveAt(Carbon $start, Carbon $end, ?Carbon $at = null): bool
//     {
//         $at = ($at ?: now())->startOfDay();
//         return $at->betweenIncluded($start->copy()->startOfDay(), $end->copy()->startOfDay());
//     }
// }

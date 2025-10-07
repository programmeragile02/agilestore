<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Jobs\NotifyWarehouseJob;
use App\Models\MstDuration;
use App\Models\Order;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MidtransWebhookController extends Controller
{
    public function handle(Request $req)
    {
        $payload = $req->all();
        Log::info('Midtrans webhook payload', $payload);

        // --- Signature check ---
        $serverKey = config('midtrans.server_key'); // ambil dari config/services.php
        $signature = $payload['signature_key'] ?? '';
        $orderId   = $payload['order_id'] ?? '';              // ex: "ORD-YYYYMMDD-000001"
        $statusCode= $payload['status_code'] ?? '';
        $gross     = (string) ($payload['gross_amount'] ?? '0');

        $expected = hash('sha512', $orderId.$statusCode.$gross.$serverKey);
        if (!hash_equals($expected, $signature)) {
            Log::warning('Midtrans signature mismatch', [
                'order_id' => $orderId,
                'status_code' => $statusCode,
                'gross_amount' => $gross,
            ]);
            return response()->json(['ok' => true], 200); // ignore silently
        }
        // --- end signature check ---

        // Ambil field status transaksi utk mapping 
        $status = $payload['transaction_status'] ?? null; // settlement|capture|pending|deny|cancel|expire
        $paymentType  = $payload['payment_type'] ?? null;
        $fraudStatus  = $payload['fraud_status'] ?? null; 

        // Cari order berdasarkan midtrans_order_id
        $order = Order::where('midtrans_order_id', $orderId)->first();
        if (!$order) {
            Log::warning('Midtrans webhook: order not found', ['midtrans_order_id' => $orderId]);
            return response()->json(['ok' => true], 200);
        }

        $wasPaidBefore = ($order->status === 'paid');

        // simpan snapshot pembayaran
        $order->payment_status          = $status;
        $order->payment_type            = $paymentType;
        $order->midtrans_transaction_id = $payload['transaction_id'] ?? $order->midtrans_transaction_id;

        // VA / bank
        if (!empty($payload['va_numbers'][0]['va_number'])) {
            $order->va_number = $payload['va_numbers'][0]['va_number'];
            $order->bank      = $payload['va_numbers'][0]['bank'] ?? null;
        }
        if (!empty($payload['permata_va_number'])) {
            $order->permata_va_number = $payload['permata_va_number'];
        }
        // QRIS data (opsional)
        if (!empty($payload['qr_string'])) {
            $order->qris_data = $payload['qr_string'];
        }

        // mapping status midtrans -> status internal
        switch ($status) {
            case 'capture':
                if ($paymentType === 'credit_card') {
                    if ($fraudStatus === 'challenge') {
                        $order->status    = 'pending';
                        $order->is_active = false;
                    } else { // accept
                        $order->status  = 'paid';
                        $order->paid_at = now();
                    }
                } else {
                    $order->status    = 'pending';
                    $order->is_active = false;
                }
                break;

            case 'settlement':
                $order->status  = 'paid';
                $order->paid_at = now();
                break;

            case 'pending':
                $order->status    = 'pending';
                $order->is_active = false;
                break;

            case 'deny':
            case 'cancel':
                $order->status    = 'failed';
                $order->is_active = false;
                break;

            case 'expire':
                $order->status    = 'expired';
                $order->is_active = false;
                break;

            default:
                // no-op
                break;
        }

        // Efek samping hanya ketika transisi ke "paid" (idempotent)
        if ($order->status === 'paid' && !$wasPaidBefore) {

            // 0) Pastikan subscription_instance_id ikut
            $meta = $order->meta ?? [];
            if (empty($meta['subscription_instance_id']) && $order->base_order_id) {
                $base = Order::find($order->base_order_id);
                $meta['subscription_instance_id'] = data_get($base?->meta, 'subscription_instance_id');
                $order->meta = $meta;
            }

            // 1) Pastikan periode terisi sesuai intent (fallback jika kosong)
            if (empty($order->start_date) || empty($order->end_date)) {
                $this->applyActivePeriodByIntent($order); // akan kita benahi di poin C
            }

            // 2) Khusus UPGRADE: aktifkan segera (in-place), karena paket berubah “sekarang”
            if ($order->intent === 'upgrade') {
                $order->is_active = true;
            } else {
                // RENEW / PURCHASE: aktif hanya bila hari ini di dalam range
                $this->syncActiveFlag($order); // hitung is_active dari start/end
            }

            $order->save();

            // 3) Sinkronkan Subscription aggregate (akan extend saat renew/upgrade)
            $this->upsertSubscriptionFromOrder($order);

            // 4) Nonaktifkan siblings dengan subscription yang sama kalau order ini aktif
            if ($order->is_active) {
                $subId = data_get($order->meta, 'subscription_instance_id');
                if ($subId) {
                    Order::query()
                        ->where('customer_id', $order->customer_id)
                        ->where('product_code', $order->product_code)
                        ->where('id', '!=', $order->id)
                        ->where('meta->subscription_instance_id', $subId)
                        ->update(['is_active' => false]);
                } else {
                    Order::query()
                        ->where('customer_id', $order->customer_id)
                        ->where('product_code', $order->product_code)
                        ->where('id', '!=', $order->id)
                        ->where('is_active', true)
                        ->update(['is_active' => false]);
                }
            }

            // 5) Kirim ke Warehouse (Provisioning)
            NotifyWarehouseJob::dispatch($order->id)->onQueue('default');
        }

        // if ($order->status === 'paid' && !$wasPaidBefore) {

        //     // 0) Pastikan subId ada
        //     $meta = $order->meta ?? [];
        //     if (empty($meta['subscription_instance_id']) && $order->base_order_id) {
        //         $base = Order::find($order->base_order_id);
        //         $meta['subscription_instance_id'] = data_get($base?->meta, 'subscription_instance_id');
        //         $order->meta = $meta;
        //     }

        //     // 1) Pastikan periode ada; kalau kosong, isi berdasarkan intent
        //     if (empty($order->start_date) || empty($order->end_date)) {
        //         $this->applyActivePeriodByIntent($order);
        //     }

        //     // 2) Set is_active HANYA jika hari ini sudah dalam range
        //     $start = $order->start_date instanceof Carbon ? $order->start_date : Carbon::parse($order->start_date)->startOfDay();
        //     $end   = $order->end_date   instanceof Carbon ? $order->end_date   : Carbon::parse($order->end_date)->endOfDay();
        //     $today = now()->startOfDay();
        //     $order->is_active = $today->betweenIncluded($start->copy()->startOfDay(), $end->copy()->startOfDay());

        //     // 3) Jika aktif sekarang → nonaktifkan saudara dalam subscription yang sama
        //     if ($order->is_active) {
        //         $subId = data_get($order->meta, 'subscription_instance_id');
        //         if ($subId) {
        //             Order::query()
        //                 ->where('customer_id', $order->customer_id)
        //                 ->where('product_code', $order->product_code)
        //                 ->where('id', '!=', $order->id)
        //                 ->where('meta->subscription_instance_id', $subId)
        //                 ->update(['is_active' => false]);
        //         } else {
        //             // fallback untuk case lama tanpa subId
        //             Order::query()
        //                 ->where('customer_id', $order->customer_id)
        //                 ->where('product_code', $order->product_code)
        //                 ->where('id', '!=', $order->id)
        //                 ->where('is_active', true)
        //                 ->update(['is_active' => false]);
        //         }
        //     }

        //     // 4) Jika upgrade → opsi: tandai base "upgraded" (boleh dipertahankan)
        //     if ($order->intent === 'upgrade' && $order->base_order_id) {
        //         $base = Order::find($order->base_order_id);
        //         if ($base && $base->is_active) {
        //             $base->is_active = true;
        //             $base->status    = 'upgraded';
        //             $base->save();
        //         }
        //     }

        //     // Selalu sinkronkan flag aktif sesuai tanggal terkini
        //     $this->syncActiveFlag($order);
    
        //     $order->save();
    
        //     // sinkronisasi
        //     $this->upsertSubscriptionFromOrder($order);
    
        //     // Gunakan job queue agar resilient (retry, backoff, dll)
        //     NotifyWarehouseJob::dispatch($order->id)->onQueue('default');
        // }


        return response()->json(['ok' => true]);
    }

    /**
     * Hitung periode aktif berdasarkan intent & duration_code.
     * Dipakai di webhook HANYA jika start/end belum ada.
     * - purchase: start=today
     * - renew   : start=(base.end_date + 1 hari) jika valid, else today
     * - upgrade : start=base
     */
    private function applyActivePeriodByIntent(Order $order): void
    {
        if ($order->intent === 'addon') {
            // Add-on tidak punya periode
            return;
        }

        $duration = MstDuration::where('code', $order->duration_code)->first();
        $today = now()->startOfDay();

        if (!$duration) {
            // fallback aman
            $order->start_date = $today;
            $order->end_date   = $today->copy()->addMonth()->subDay()->endOfDay();
            return;
        }

        $len  = (int) $duration->length;
        $unit = strtolower((string) $duration->unit);

        $calcEnd = function (Carbon $start) use ($len, $unit) {
            if (in_array($unit, ['month', 'months'], true)) return $start->copy()->addMonthsNoOverflow($len)->subDay()->endOfDay();
            if (in_array($unit, ['day', 'days'], true))     return $start->copy()->addDays($len)->subDay()->endOfDay();
            return $start->copy()->addMonthsNoOverflow($len)->subDay()->endOfDay();
        };

        // --- Intent-specific ---
        if ($order->intent === 'renew') {
            $base = $order->base_order_id ? Order::find($order->base_order_id) : null;
            $baseEnd = $base?->end_date ? $base->end_date->copy()->startOfDay() : null;

            $start = $baseEnd && $baseEnd->gte($today)
                    ? $baseEnd->copy()->addDay()->startOfDay() // lanjutan dari end lama
                    : $today->copy();                           // sudah lewat → mulai hari ini

            $end = $calcEnd($start);

            $order->start_date = $start;
            $order->end_date   = $end;
            return;
        }

        if ($order->intent === 'upgrade') {
            $base = $order->base_order_id ? Order::find($order->base_order_id) : null;

            // start: pertahankan start lama (histori)
            $start = $base?->start_date ? $base->start_date->copy()->startOfDay() : $today->copy();

            // end: extend dari end lama (atau dari hari ini jika sudah lewat)
            $baseEnd = $base?->end_date ? $base->end_date->copy()->startOfDay() : null;
            $extendStart = $baseEnd && $baseEnd->gte($today)
                ? $baseEnd->copy()->addDay()->startOfDay()
                : $today->copy();

            $end = $calcEnd($extendStart);

            // keep start lama, tapi end baru = yang lebih MAJU
            $order->start_date = $start;
            $order->end_date   = $end;
            return;
        }

        // purchase (default)
        $start = $today->copy();
        $end   = $calcEnd($start);
        $order->start_date = $start;
        $order->end_date   = $end;
    }

    // private function applyActivePeriodByIntent(Order $order): void
    // {
    //     $duration = MstDuration::where('code', $order->duration_code)->first();
    //     $today = now()->startOfDay();
    //     $start = $today->copy();
    //     $end   = null;

    //     if ($order->intent === 'renew' || $order->intent === 'upgrade' && $order->base_order_id) {
    //         $base = Order::find($order->base_order_id);
    //         if ($base && $base->end_date instanceof Carbon) {
    //             $baseEnd = $base->end_date->copy()->startOfDay();
    //             $start = $baseEnd->gte($today) ? $baseEnd->copy()->addDay()->startOfDay() : $today->copy();
    //         }
    //         // end dihitung dari duration
    //     }

    //     // purchase / renew (atau fallback upgrade jika base tidak lengkap)
    //     if ($duration) {
    //         $length = (int) $duration->length;
    //         $unit   = strtolower((string) $duration->unit);
    //         if (in_array($unit, ['month','months'], true)) {
    //             $end = $start->copy()->addMonthsNoOverflow($length)->subDay()->endOfDay();
    //         } elseif (in_array($unit, ['day','days'], true)) {
    //             $end = $start->copy()->addDays($length)->subDay()->endOfDay();
    //         } else {
    //             $end = $start->copy()->addMonthsNoOverflow($length)->subDay()->endOfDay();
    //         }
    //     }

    //     $order->start_date = $start;
    //     $order->end_date   = $end;
    // }

    // sinkronisasi is_active
    private function syncActiveFlag(Order $order): void
    {
        $today = now()->startOfDay();
        $start = $order->start_date ? Carbon::parse($order->start_date)->startOfDay() : null;
        $end   = $order->end_date   ? Carbon::parse($order->end_date)->endOfDay()   : null;

        $order->is_active = ($start && $end) ? $today->betweenIncluded($start, $end) : false;
    }

    // private function syncActiveFlag(Order $order): void
    // {
    //     $today = now()->startOfDay();

    //     $start = optional($order->start_date)?->copy()->startOfDay();
    //     $end   = optional($order->end_date)?->copy()->endOfDay();

    //     // aktif hanya jika hari ini berada di range
    //     $order->is_active = ($start && $end) ? $today->between($start, $end) : false;
    // }

    private function upsertSubscriptionFromOrder(Order $order): void
    {
        // ADD-ON: cukup update meta last_paid_order_id, jangan sentuh durasi/paket/tanggal
        if ($order->intent === 'addon') {
            $subId = $order->meta['subscription_instance_id'] ?? null;
            if (!$subId) return;

            $sub = Subscription::firstOrCreate(
                ['id' => $subId],
                [
                    'customer_id'  => $order->customer_id,
                    'product_code' => $order->product_code,
                    'product_name' => $order->product_name,
                    'is_active'    => true,
                    'status'       => 'active',
                ]
            );

            $meta = $sub->meta ?? [];
            $meta['last_paid_order_id'] = (string) $order->id;
            $sub->meta = $meta;
            $sub->save();

            return;
        }

        $subId = $order->meta['subscription_instance_id'] ?? null;
        if (!$subId) {
            // fallback (harusnya tidak terjadi kalau controller sudah benar)
            $subId = (string) Str::uuid();
            $order->meta = array_merge($order->meta ?? [], ['subscription_instance_id' => $subId]);
            $order->save();
        }

        $today    = now()->startOfDay();
        $duration = MstDuration::where('code', $order->duration_code)->first();

        $calcEnd = function(Carbon $start) use ($duration) {
            $len  = (int) $duration->length;
            $unit = strtolower($duration->unit);
            if (in_array($unit, ['month','months'], true)) return $start->copy()->addMonthsNoOverflow($len)->subDay();
            if (in_array($unit, ['day','days'], true))    return $start->copy()->addDays($len)->subDay();
            return $start->copy()->addMonthsNoOverflow($len)->subDay();
        };

        $sub = Subscription::firstOrNew(['id' => $subId], [
            'customer_id'  => $order->customer_id,
            'product_code' => $order->product_code,
            'product_name' => $order->product_name,
            'is_active'    => true,
            'status'       => 'active',
        ]);

        if (!$sub->exists) {
            // PURCHASE pertama → isi penuh
            $start = $today->copy();
            $end   = $calcEnd($start);

            $sub->fill([
                'current_package_code' => $order->package_code,
                'current_package_name' => $order->package_name,
                'duration_code'        => $order->duration_code,
                'duration_name'        => $order->duration_name,
                'start_date'           => $start->toDateString(),
                'end_date'             => $end->toDateString(),
            ]);
        } else {
            // SUDAH ADA: renew / upgrade
            $sub->product_name  = $order->product_name;
            $sub->duration_code = $order->duration_code;
            $sub->duration_name = $order->duration_name;

            if ($order->intent === 'renew') {
                $baseEnd = $sub->end_date?->copy()->startOfDay();
                // kalau sudah lewat, mulai dari hari ini; kalau masih aktif, lanjutin dari end lama + 1
                $start   = ($baseEnd && $baseEnd->gte($today)) ? $baseEnd->copy()->addDay() : $today->copy();
                $newEnd  = $calcEnd($start);
                $sub->end_date = $newEnd->toDateString();
                $sub->is_active = true;
                $sub->status = 'active';
            }

            if ($order->intent === 'upgrade') {
                // ganti paket
                $sub->current_package_code = $order->package_code;
                $sub->current_package_name = $order->package_name;

                // kalau upgrade juga beli durasi, kamu bisa extend di sini (opsional).
                // contoh extend:
                $baseEnd = $sub->end_date?->copy()->startOfDay() ?? $today->copy()->subDay();
                $start   = $baseEnd->copy()->addDay();
                $newEnd  = $calcEnd($start);
                // ambil yang paling maju
                if (!$sub->end_date || $newEnd->gt($sub->end_date)) {
                    $sub->end_date = $newEnd->toDateString();
                }
            }
        }

        $sub->save();

        // simpan pointer ke order paid terakhir
        $meta = $sub->meta ?? [];
        $meta['last_paid_order_id'] = (string) $order->id;
        $sub->meta = $meta;
        $sub->save();
    }
}

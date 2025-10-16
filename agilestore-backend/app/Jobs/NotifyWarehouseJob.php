<?php

// namespace App\Jobs;

// use App\Models\Order;
// use Illuminate\Bus\Queueable;
// use Illuminate\Contracts\Queue\ShouldQueue;
// use Illuminate\Foundation\Bus\Dispatchable;
// use Illuminate\Queue\InteractsWithQueue;
// use Illuminate\Support\Facades\Http;
// use Illuminate\Support\Facades\Log;
// use Illuminate\Support\Str;

// class NotifyWarehouseJob implements ShouldQueue
// {
//     use Dispatchable, Queueable, InteractsWithQueue;

//     /**
//      * Maksimal retry oleh queue worker.
//      * (Selain ini, kita pakai release() manual saat 5xx).
//      */
//     public $tries = 5;

//     /**
//      * Backoff (detik) antar percobaan.
//      */
//     public $backoff = [10, 30, 60,  120];

//     public function __construct(public string $orderId) {}

//     public function handle(): void
//     {
//         $order = Order::find($this->orderId);
//         if (!$order) {
//             Log::warning('[WH] order not found, skip', ['order_id' => $this->orderId]);
//             return;
//         }

//         // Hindari kirim ulang bila mau—opsional: simpan flag di order (mis. provision_notified_at)
//         // if ($order->provision_notified_at) return;

//         // Kirim hanya saat PAID (idempotent: warehouse harus aman jika menerima ulang dengan idempotency-key sama)
//         if ($order->status !== 'paid') {
//             Log::info('[WH] order not paid yet, skip', [
//                 'order_id' => $order->id,
//                 'status'   => $order->status,
//             ]);
//             return;
//         }

//         $payload = [
//             'id'              => (string) Str::uuid(),   // idempotency key di warehouse
//             'order_id'        => (string) $order->id,
//             'customer_id'     => (string) $order->customer_id,

//             'intent'          => $order->intent,         // purchase|renew|upgrade
//             'base_order_id'   => $order->base_order_id,  // untuk renew/upgrade

//             'product_code'    => $order->product_code,
//             'product_name'    => $order->product_name,
//             'package'         => ['code'=>$order->package_code,'name'=>$order->package_name],
//             'duration'        => ['code'=>$order->duration_code,'name'=>$order->duration_name],

//             'start_date'      => optional($order->start_date)->toDateString(),
//             'end_date'        => optional($order->end_date)->toDateString(),
//             'is_active'       => (bool) $order->is_active,

//             'midtrans_order_id' => $order->midtrans_order_id,
//             'subscription_instance_id' => data_get($order->meta, 'subscription_instance_id'),

//             // meta untuk kredensial/komunikasi
//             'customer_name'   => $order->customer_name,
//             'customer_email'  => $order->customer_email,
//             'customer_phone'  => $order->customer_phone,
//         ];

//         // Endpoint & Security
//         $url = rtrim(env('WAREHOUSE_URL', ''), '/').'/api/provisioning/jobs';
//         if (!$url || !str_starts_with($url, 'http')) {
//             Log::warning('WAREHOUSE_URL not set or invalid, skip notify');
//             return;
//         }

//         $body      = json_encode($payload);
//         $signature = hash_hmac('sha256', $body, env('WAREHOUSE_SECRET', ''));

//         // Gunakan Idempotency-Key = order UUID supaya
//         // pengiriman ulang (retry) tidak membuat duplikasi di Warehouse.
//         $idempotencyKey = (string) $order->id;

//         Log::info('Notify warehouse trying', [
//             'url' => $url,
//             'has_secret' => (bool) env('WAREHOUSE_SECRET'),
//             'order_id' => (string)$order->id,
//             'intent' => $order->intent,
//             'customer_id' => (string)$order->customer_id,
//             'status' => $order->status,
//         ]);

//         $resp = Http::timeout(20)->connectTimeout(10)->withHeaders([
//             'Accept'            => 'application/json',
//             'Content-Type'      => 'application/json',
//             'X-Agile-Signature' => $signature,
//             'Idempotency-Key'   => $idempotencyKey,
//         ])->post($url, $payload);

//         Log::info('Notify warehouse response', [
//             'status' => $resp->status(),
//             'body'   => $resp->body(),
//         ]);

//         if ($resp->serverError()) {
//             // 5xx → release biar retry via queue
//             $this->release(60);
//             return;
//         }

//         if (!$resp->successful()) {
//             // 4xx: biasanya problem payload/auth → log error dan biarkan job failed
//             Log::error('[WH] non-success', [
//                 'status' => $resp->status(),
//                 'body'   => $resp->body(),
//             ]);
//             throw new \RuntimeException('Warehouse responded non-2xx');
//         }

//         // if (!$resp->successful()) {
//         //     Log::error('Notify warehouse failed', [
//         //         'status' => $resp->status(),
//         //         'body'   => $resp->body(),
//         //     ]);
//         //     $this->release(60); // retry nanti
//         //     return;
//         // }

//         Log::info('Notify warehouse success', ['order_id' => $order->id]);

//         // tandai sudah notify
//         $order->provision_notified_at = now();
//         $order->save();
//     }
// }

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotifyWarehouseJob implements ShouldQueue
{
    use Dispatchable, Queueable, InteractsWithQueue;

    public $tries   = 5;
    public $backoff = [10, 30, 60, 120];

    public function __construct(public string $orderId) {}

    public function handle(): void
    {
        $order = Order::find($this->orderId);
        if (!$order) { Log::warning('[WH] order not found', ['order_id'=>$this->orderId]); return; }
        if ($order->status !== 'paid') {
            Log::info('[WH] order not paid yet, skip', ['order_id'=>$order->id, 'status'=>$order->status]);
            return;
        }

        $payload = [
            'id'              => (string) Str::uuid(),
            'order_id'        => (string) $order->id,
            'customer_id'     => (string) $order->customer_id,

            'intent'          => $order->intent,        // purchase|renew|upgrade|addon
            'base_order_id'   => $order->base_order_id,

            'product_code'    => $order->product_code,
            'product_name'    => $order->product_name,

            'package'         => ['code'=>$order->package_code,'name'=>$order->package_name],
            'duration'        => ['code'=>$order->duration_code,'name'=>$order->duration_name],

            'start_date'      => optional($order->start_date)->toDateString(),
            'end_date'        => optional($order->end_date)->toDateString(),
            'is_active'       => (bool) $order->is_active,

            'midtrans_order_id'        => $order->midtrans_order_id,
            'subscription_instance_id' => data_get($order->meta, 'subscription_instance_id'),

            'customer_name'   => $order->customer_name,
            'customer_email'  => $order->customer_email,
            'customer_phone'  => $order->customer_phone,
        ];

        if ($order->intent === 'addon') {
            // parents = item berbayar (untuk tabel subscription_addons)
            $parents = collect($order->meta['lines'] ?? [])
                ->map(fn($l) => [
                    'feature_code' => (string)($l['feature_code'] ?? ''),
                    'name'         => (string)($l['name'] ?? ($l['feature_code'] ?? '')),
                    'price'        => (int)($l['amount'] ?? 0),
                ])
                ->filter(fn($x) => $x['feature_code'] !== '')
                ->values()
                ->all();

            // grant = parent + children, untuk overrides
            $grant = array_values($order->meta['grant_features'] ?? []);

            $payload['addons'] = [
                'parents' => $parents,
                'grant'   => $grant,
            ];
            $payload['start_date'] = null;
            $payload['end_date']   = null;
        }

        $url = rtrim(env('WAREHOUSE_URL',''),'/').'/api/provisioning/jobs';
        if (!$url || !str_starts_with($url,'http')) {
            Log::warning('[WH] WAREHOUSE_URL invalid or empty');
            return;
        }

        $body        = json_encode($payload);
        $signature   = hash_hmac('sha256', $body, env('WAREHOUSE_SECRET',''));
        $idempotency = (string)$order->id;

        Log::info('[WH] sending', [
            'url' => $url,
            'order_id' => (string)$order->id,
            'intent' => $order->intent,
            'has_secret' => (bool) env('WAREHOUSE_SECRET'),
        ]);

        try {
            $resp = Http::timeout(20)->connectTimeout(10)->withHeaders([
                'Accept'            => 'application/json',
                'Content-Type'      => 'application/json',
                'X-Agile-Signature' => $signature,
                'Idempotency-Key'   => $idempotency,
            ])->post($url, $payload);
        } catch (\Throwable $e) {
            Log::error('[WH] HTTP error', ['err'=>$e->getMessage()]);
            $this->release(60);
            return;
        }

        Log::info('Notify warehouse response', [
            'status' => $resp->status(),
            'body'   => $resp->body(),
        ]);

        if ($resp->serverError()) { $this->release(60); return; }
        if (!$resp->successful()) {
            Log::error('[WH] non-success', ['status'=>$resp->status(),'body'=>$resp->body()]);
            throw new \RuntimeException('Warehouse responded non-2xx');
        }

        $order->provision_notified_at = now();
        $order->save();
    }
}
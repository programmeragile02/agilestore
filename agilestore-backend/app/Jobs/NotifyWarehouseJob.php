<?php

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

        // if ($order->intent === 'addon') {
        //     // parents = item berbayar (untuk tabel subscription_addons)
        //     $parents = collect($order->meta['lines'] ?? [])
        //         ->map(fn($l) => [
        //             'feature_code' => (string)($l['feature_code'] ?? ''),
        //             'name'         => (string)($l['name'] ?? ($l['feature_code'] ?? '')),
        //             'price'        => (int)($l['amount'] ?? 0),
        //         ])
        //         ->filter(fn($x) => $x['feature_code'] !== '')
        //         ->values()
        //         ->all();

        //     // grant = parent + children, untuk overrides
        //     $grant = array_values($order->meta['grant_features'] ?? []);

        //     $payload['addons'] = [
        //         'parents' => $parents,
        //         'grant'   => $grant,
        //     ];
        //     $payload['start_date'] = null;
        //     $payload['end_date']   = null;
        // }

        
        if ($order->intent === 'addon') {
            $meta = is_array($order->meta) ? $order->meta : (json_decode((string)$order->meta, true) ?: []);

            // Ambil currency & policy dari meta order kalau ada
            $currency        = (string) data_get($meta, 'currency', $order->currency ?? 'IDR');
            $billCycleOffset = (int)    data_get($meta, 'bill_cycle_offset', 1);
            $billFromStart   =          data_get($meta, 'billable_from_start'); // "YYYY-MM-DD" | null

            // Sumber data lines (struktur baru):
            $featureLines = (array) data_get($meta, 'lines.features', []); // parent FEATURES (tanpa qty)
            $addonLines   = (array) data_get($meta, 'lines.addons',   []); // MASTER ADDONS (dengan qty, addon_code, dsb.)

            // Normalisasi: jadikan satu array "parents" dengan field seragam yang Warehouse pahami.
            $parentsFeatures = collect($featureLines)->map(function ($l) use ($currency) {
                $code = (string) ($l['feature_code'] ?? '');
                $name = (string) ($l['name'] ?? ($code ?: ''));
                $amount = (int) ($l['amount'] ?? 0);

                if ($code === '' || $amount <= 0) return null;

                // kind default 'feature'
                $kind = 'feature';

                return [
                    // Untuk kompatibilitas (Controller Warehouse lama pakai feature_code):
                    'feature_code' => $code,
                    // Tambahkan juga addon_code agar forward-compatible:
                    'addon_code'   => $code,

                    'name'         => $name,
                    'price'        => $amount,     // nama lama di Warehouse: price
                    'amount'       => $amount,     // simpan juga sebagai amount (kalau nanti dipakai)
                    'qty'          => 1,
                    'unit_price'   => $amount,     // feature lama dianggap flat 1x
                    'pricing_mode' => 'flat',
                    'kind'         => $kind,
                    'currency'     => $currency,
                ];
            })->filter()->values();

            $parentsAddons = collect($addonLines)->map(function ($l) use ($currency) {
                // MASTER ADDON
                $code = (string) ($l['addon_code']   ?? ($l['feature_code'] ?? ''));
                $name = (string) ($l['name']         ?? ($code ?: ''));
                $qty  = (int)    ($l['qty']          ?? 1);
                $unit = (int)    ($l['unit_price']   ?? 0);
                $mode = (string) ($l['pricing_mode'] ?? 'per_unit');

                // Hindari notice "Undefined array key 'kind'" → pakai variabel lokal
                $kindCandidate = (string) ($l['kind'] ?? 'master');
                $kind = in_array($kindCandidate, ['feature','master'], true) ? $kindCandidate : 'master';

                $amount = (int) ($l['amount'] ?? ($mode === 'flat' ? $unit : $unit * max(1, $qty)));

                if ($code === '' || $amount <= 0) return null;

                return [
                    // Kompat: tetap kirim feature_code agar lolos validator lama
                    'feature_code' => $code,
                    // Dan kirim addon_code untuk skema baru
                    'addon_code'   => $code,

                    'name'         => $name,
                    'price'        => $amount,
                    'amount'       => $amount,
                    'qty'          => max(1, $qty),
                    'unit_price'   => $unit,
                    'pricing_mode' => $mode,
                    'kind'         => $kind,
                    'currency'     => (string) ($l['currency'] ?? $currency),
                ];
            })->filter()->values();

            $parents = $parentsFeatures->merge($parentsAddons)->values()->all();

            // grant = parent + children (opsional, untuk overrides langsung aktif)
            $grant = array_values((array) data_get($meta, 'grant_features', []));

            $payload['addons'] = [
                'parents' => $parents,
                'grant'   => $grant,
            ];

            // Tambahkan kebijakan penagihan utk audit (warehouse hanya log)
            $payload['policy'] = [
                'bill_cycle_offset'   => $billCycleOffset, // 1 = next renewal
                'billable_from_start' => $billFromStart,   // "YYYY-MM-DD" | null
            ];

            // Untuk addon: periode subscription tidak diubah
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
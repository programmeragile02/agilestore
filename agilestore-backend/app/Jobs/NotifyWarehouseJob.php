<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotifyWarehouseJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public $tries = 5;              // maksimal retry
    public $backoff = [10, 30, 60]; // detik (incremental backoff)

    public function __construct(public string $orderId) {}

    public function handle(): void
    {
        $order = Order::find($this->orderId);
        if (!$order) return;

        // Hindari kirim ulang bila mau—opsional: simpan flag di order (mis. provision_notified_at)
        // if ($order->provision_notified_at) return;

        $payload = [
            'id'         => (string) Str::uuid(), // idempotent di Warehouse
            'order_id'       => $order->id,
            'customer_id'    => $order->customer_id,
            'product_code'   => $order->product_code,   // gunakan code, bukan nama
            'product_id'     => $order->product_id ?? null,
            'customer_name'  => $order->customer_name,
            'customer_email' => $order->customer_email,
            'customer_phone' => $order->customer_phone,
        ];

        $url = rtrim(env('WAREHOUSE_URL', ''), '/').'/api/provisioning/jobs';
        if (!$url || !str_starts_with($url, 'http')) {
            Log::warning('WAREHOUSE_URL not set or invalid, skip notify');
            return;
        }

        $body      = json_encode($payload);
        $signature = hash_hmac('sha256', $body, env('WAREHOUSE_SECRET', ''));

        Log::info('Notify warehouse trying', [
            'url' => $url,
            'has_secret' => (bool) env('WAREHOUSE_SECRET'),
            'order_id' => (string)$order->id,
            'customer_id' => (string)$order->customer_id,
            'status' => $order->status,
        ]);

        $resp = Http::withHeaders([
            'Accept'            => 'application/json',
            'Content-Type'      => 'application/json',
            'X-Agile-Signature' => $signature,
        ])->post($url, $payload);

        Log::info('Notify warehouse response', [
            'status' => $resp->status(),
            'body'   => $resp->body(),
        ]);

        if (!$resp->successful()) {
            Log::error('Notify warehouse failed', [
                'status' => $resp->status(),
                'body'   => $resp->body(),
            ]);
            $this->release(30); // retry nanti
            return;
        }

        Log::info('Notify warehouse success', ['order_id' => $order->id, 'data' => $payload]);

        // Opsional: tandai sudah notify
        // $order->provision_notified_at = now();
        // $order->save();
    }
}

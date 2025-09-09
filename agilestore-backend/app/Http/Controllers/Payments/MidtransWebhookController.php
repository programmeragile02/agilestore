<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Jobs\NotifyWarehouseJob;
use App\Models\MstDuration;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
                        $this->applyActivePeriod($order); // set start/end/is_active
                    }
                } else {
                    $order->status    = 'pending';
                    $order->is_active = false;
                }
                break;

            case 'settlement':
                $order->status  = 'paid';
                $order->paid_at = now();
                $this->applyActivePeriod($order); // set start/end/is_active
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

        $order->save();

        // --- Jika paid → kirim job provisioning ke Warehouse
        if ($order->status === 'paid') {
            // Gunakan job queue agar resilient (retry, backoff, dll)
            NotifyWarehouseJob::dispatch($order->id)->onQueue('default');
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Set masa aktif berdasarkan duration_code.
     * - start_date: today (Asia/Jakarta) atau hari setelah end_date terakhir (renew-aware)
     * - end_date: inclusive (bulan: +N month - 1 day | hari: +N day - 1 day)
     * - is_active: true
     */
    public function applyActivePeriod(Order $order): void
    {
        // Ambil definisi durasi
        $duration = MstDuration::where('code', $order->duration_code)->first();

        $today = now()->startOfDay();

        // === Renew-aware: cari order aktif terakhir customer & product
        $lastActive = Order::query()
            ->where('customer_id', $order->customer_id)
            ->where('product_code', $order->product_code)
            ->where('status', 'paid')
            ->where('is_active', true)
            ->whereNotNull('end_date')
            ->orderByDesc('end_date')
            ->first();

        // start default = today
        $start = $today->copy();

        if ($lastActive && $lastActive->end_date && $lastActive->end_date->gte($today)) {
            // tumpuk: mulai H+1 dari end_date terakhir
            $start = $lastActive->end_date->copy()->addDay()->startOfDay();
        }

        // hitung end
        $end = null;
        if ($duration) {
            $length = (int) $duration->length;
            $unit   = strtolower((string) $duration->unit); // 'month'|'months'|'day'|'days'
            if (in_array($unit, ['month', 'months'], true)) {
                $end = $start->copy()->addMonthsNoOverflow($length)->subDay(); // inclusive
            } elseif (in_array($unit, ['day', 'days'], true)) {
                $end = $start->copy()->addDays($length)->subDay(); // inclusive
            } else {
                // fallback treat as month
                $end = $start->copy()->addMonthsNoOverflow($length)->subDay();
            }
        }

        $order->start_date = $start;
        $order->end_date   = $end;
        $order->is_active  = true;
    }
}

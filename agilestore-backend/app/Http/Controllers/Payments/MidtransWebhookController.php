<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Jobs\NotifyWarehouseJob;
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
        $orderId   = $payload['order_id'] ?? '';              // ex: "ORD-{uuid}"
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

        // Ambil field status transaksi utk mapping (kamu lupa set $status)
        $status = $payload['transaction_status'] ?? null;
        $paymentType  = $payload['payment_type'] ?? null;
        $fraudStatus  = $payload['fraud_status'] ?? null; 

        // extract uuid dari "ORD-{uuid}"
        // $id = preg_replace('/^ORD-/', '', $orderId);

        // $order = Order::where('id', $id)->first();

        $orderIdRaw = (string) ($payload['order_id'] ?? '');
        $id = str_starts_with($orderIdRaw, 'ORD-') ? substr($orderIdRaw, 4) : $orderIdRaw;
        // atau kalau id kamu memang UUID yang kamu simpan, cukup simpan juga midtrans_order_id
        // Cari order berdasarkan midtrans_order_id
        $order = Order::where('midtrans_order_id', $orderIdRaw)->first();

        if (!$order && str_starts_with($orderIdRaw, 'ORD-')) {
            $uuid = substr($orderIdRaw, 4);
            $order = Order::find($uuid);
        }

        // simpan snapshot penting
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

        // mapping status
        switch ($status) {
        case 'capture':
            if ($paymentType === 'credit_card') {
                if ($fraudStatus === 'challenge') {
                    $order->status = 'pending';
                } else { // accept atau null
                    $order->status  = 'paid';
                    $order->paid_at = now();
                }
            } else {
                // Non-cc jarang "capture", fallback ke pending
                $order->status = 'pending';
            }
            break;

        case 'settlement':
            $order->status  = 'paid';
            $order->paid_at = now();
            break;

        case 'pending':
            $order->status = 'pending';
            break;

        case 'deny':
        case 'cancel':
            $order->status = 'failed';
            break;

        case 'expire':
            $order->status = 'expired';
            break;

        default:
        // biarkan tanpa perubahan
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
}

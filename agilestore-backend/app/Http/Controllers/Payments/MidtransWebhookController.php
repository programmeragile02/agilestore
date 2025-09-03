<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function handle(Request $req)
    {
        $payload = $req->all();
        Log::info('Midtrans webhook payload', $payload);

        $orderId = $payload['order_id']     ?? null; // "ORD-{uuid}"
        $status  = $payload['transaction_status'] ?? null;
        $type    = $payload['payment_type'] ?? null;

        if (!$orderId) {
            return response()->json(['ok' => true]); // ignore
        }

        // extract uuid dari "ORD-{uuid}"
        $id = preg_replace('/^ORD-/', '', $orderId);

        $order = Order::where('id', $id)->first();
        if (!$order) return response()->json(['ok' => true]);

        // simpan snapshot penting
        $order->payment_status          = $status;
        $order->payment_type            = $type;
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
        }

        $order->save();

        return response()->json(['ok' => true]);
    }
}

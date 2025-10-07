<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\MidtransService;

class OrderStatusController extends Controller
{
    public function refresh(string $id, MidtransService $midtrans)
    {
        $order = Order::findOrFail($id);

        if ($order->status !== 'pending' || !$order->midtrans_order_id) {
            return response()->json(['success'=>true, 'data'=>['status'=>$order->status]]);
        }

        $res = $midtrans->status($order->midtrans_order_id);
        $status      = $res->transaction_status ?? null;
        $paymentType = $res->payment_type ?? null;
        $fraudStatus = $res->fraud_status ?? null;

        switch ($status) {
            case 'capture':
                if ($paymentType === 'credit_card' && $fraudStatus === 'challenge') {
                    $order->status = 'pending';
                    $order->is_active = false;
                } else {
                    $order->status = 'paid';
                    $order->paid_at = now();
                }
                break;
            case 'settlement':
                $order->status = 'paid';
                $order->paid_at = now();
                break;
            case 'pending':
                $order->status = 'pending';
                $order->is_active = false;
                break;
            case 'deny':
            case 'cancel':
                $order->status = 'failed';
                $order->is_active = false;
                break;
            case 'expire':
                $order->status = 'expired';
                $order->is_active = false;
                break;
        }

        $order->payment_status = $status;
        $order->payment_type   = $paymentType;
        $order->save();

        if ($order->status === 'paid') {
            \App\Jobs\NotifyWarehouseJob::dispatch($order->id)->onQueue('provisioning');
        }

        return response()->json(['success'=>true, 'data'=>['status'=>$order->status]]);
    }
}


// namespace App\Http\Controllers;

// use App\Models\Order;
// use App\Services\MidtransService;
// use App\Support\Payments\MidtransMapper;

// class OrderStatusController extends Controller
// {
//     public function refresh(string $id, MidtransService $midtrans)
//     {
//         $order = Order::findOrFail($id);

//         // Kalau sudah final (paid/expired/failed) langsung balas
//         if ($order->status !== 'pending' || !$order->midtrans_order_id) {
//             return response()->json(['success'=>true, 'data'=>['status'=>$order->status]]);
//         }

//         // Cek ke Midtrans
//         $res = $midtrans->status($order->midtrans_order_id); // stdClass
//         $status = $res->transaction_status ?? null;  // settlement|capture|pending|deny|cancel|expire
//         $paymentType = $res->payment_type ?? null;
//         $fraudStatus = $res->fraud_status ?? null;

//         // --- SALIN mapping yang sama seperti di webhook ---
//         switch ($status) {
//             case 'capture':
//                 if ($paymentType === 'credit_card' && $fraudStatus === 'challenge') {
//                     $order->status = 'pending';
//                     $order->is_active = false;
//                 } else {
//                     $order->status = 'paid';
//                     $order->paid_at = now();
//                     app(\App\Http\Controllers\Payments\MidtransWebhookController::class)
//                         ->applyActivePeriod($order); // jadikan public static jika perlu
//                 }
//                 break;

//             case 'settlement':
//                 $order->status = 'paid';
//                 $order->paid_at = now();
//                 app(\App\Http\Controllers\Payments\MidtransWebhookController::class)
//                     ->applyActivePeriod($order);
//                 break;

//             case 'pending':
//                 $order->status = 'pending';
//                 $order->is_active = false;
//                 break;

//             case 'deny':
//             case 'cancel':
//                 $order->status = 'failed';
//                 $order->is_active = false;
//                 break;

//             case 'expire':
//                 $order->status = 'expired';
//                 $order->is_active = false;
//                 break;
//         }

//         $order->payment_status = $status;
//         $order->payment_type   = $paymentType;
//         $order->save();

//         if ($order->status === 'paid') {
//             \App\Jobs\NotifyWarehouseJob::dispatch($order->id)->onQueue('default');
//         }

//         return response()->json(['success'=>true, 'data'=>['status'=>$order->status]]);
//     }
// }

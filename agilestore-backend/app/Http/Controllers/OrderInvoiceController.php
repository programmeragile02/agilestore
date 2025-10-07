<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Order;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OrderInvoiceController extends Controller
{
    public function download(Request $request, string $id)
    {
        // guard customer-api
        $customer = $request->user('customer-api');
        if (!$customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // ambil order + cek kepemilikan
        $order = Order::with('customer')->findOrFail($id);
        if ((string)$order->customer_id !== (string)$customer->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // hanya boleh jika paid
        if ($order->status !== 'paid') {
            return response()->json(['message' => 'Invoice available only for PAID orders'], 422);
        }

        // === Nomor invoice = midtrans_order_id ===
        $invoiceNo = $this->invoiceNumber($order);
        $issuedAt  = Carbon::parse($order->paid_at ?? $order->created_at);

        // data ke view
        $data = [
            'invoice_no' => $invoiceNo,
            'issued_at'  => $issuedAt,
            'order'      => $order,
            'customer'   => (object)[
                'name'  => $order->customer_name,
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
            ],
            'company'    => (object)[
                'name'    => 'Agile Store',
                'address' => 'Jl. Contoh No. 123, Jakarta',
                'email'   => 'billing@agilestore.id',
                'phone'   => '+62 812-0000-0000',
            ],
            'items'      => [
                (object)[
                    'description' => sprintf(
                        '%s — %s (%s)',
                        $order->product_name ?? $order->product_code,
                        $order->package_name ?? $order->package_code,
                        $order->duration_name ?? $order->duration_code
                    ),
                    'qty'        => 1,
                    'unit_price' => (float)$order->price,
                    'subtotal'   => (float)$order->price,
                ],
            ],
            'discount'    => (float)$order->discount,
            'currency'    => $order->currency ?? 'IDR',
            'total'       => (float)$order->total,
            'tax_percent' => null, // isi jika perlu PPN 11 = 11
        ];

        $pdf = Pdf::loadView('pdf.invoice', $data)->setPaper('a4');
        $filename = 'invoice-' . Str::slug($invoiceNo) . '.pdf';

        return $pdf->download($filename);
        // atau stream:
        // return $pdf->stream($filename);
    }

    protected function invoiceNumber(Order $order): string
    {
        // sanitize untuk jaga-jaga, tapi isi tetap midtrans_order_id
        $mid = $order->midtrans_order_id ?: (string) $order->id;
        return preg_replace('/[^A-Za-z0-9\-\._]/', '-', strtoupper($mid));
    }
}
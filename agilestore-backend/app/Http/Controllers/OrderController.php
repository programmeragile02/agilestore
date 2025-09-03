<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MstDuration;
use App\Models\MstProductPackage;
use App\Models\Order;
use App\Services\MidtransService;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(Request $req, PricingService $pricing, MidtransService $midtrans)
    {
        $data = $req->validate([
            'product_code'   => 'required|string|exists:mst_products,product_code',
            'package_code'   => 'required|string|exists:mst_product_packages,package_code',
            'duration_code'  => 'required|string|exists:mst_durations,code',

            // opsi 1: kirim customer_id
            'customer_id'    => 'nullable|string',

            // opsi 2: kirim data customer (akan find-or-create by email)
            'customer_name'  => 'required_without:customer_id|string|max:150',
            'customer_email' => 'required_without:customer_id|email|max:150',
            'customer_phone' => 'nullable|string|max:50',
        ]);

        // Validasi paket sesuai product_code
        $package = MstProductPackage::where('package_code', $data['package_code'])
            ->where('product_code', $data['product_code'])
            ->first();

        if (!$package) {
            throw ValidationException::withMessages([
                'package_code' => 'Paket tidak sesuai dengan produk yang dipilih.',
            ]);
        }

        // Validasi duration
        $duration = MstDuration::where('code', $data['duration_code'])->first();
        if (!$duration) {
            throw ValidationException::withMessages([
                'duration_code' => 'Durasi tidak valid.',
            ]);
        }

        // Resolve customer
        $customer = null;
        if (!empty($data['customer_id'])) {
            $customer = Customer::find($data['customer_id']);
            if (!$customer) {
                throw ValidationException::withMessages([
                    'customer_id' => 'Customer tidak ditemukan.',
                ]);
            }
        } else {
            // find-or-create berdasarkan email
            $customer = Customer::firstOrCreate(
                ['email' => $data['customer_email']],
                ['name'  => $data['customer_name'], 'phone' => $data['customer_phone'] ?? null]
            );
        }

        // Hitung harga
        $priceInfo = $pricing->resolvePrice(
            $data['product_code'],
            $data['package_code'],
            $data['duration_code'],
        );

        // Buat order (status pending)
        $order = new Order();
        $order->fill([
            'customer_id'      => (string) $customer->id,
            'customer_name'    => $customer->name,
            'customer_email'   => $customer->email,
            'customer_phone'   => $customer->phone,

            'product_code'     => $data['product_code'],
            'package_code'     => $data['package_code'],
            'duration_code'    => $data['duration_code'],
            'pricelist_item_id'=> $priceInfo['pricelist_item_id'],

            'price'            => $priceInfo['price'],
            'discount'         => $priceInfo['discount'],
            'total'            => $priceInfo['total'],
            'currency'         => $priceInfo['currency'],

            'status'           => 'pending',
        ]);
        $order->save();

        // Payload Midtrans
        $midtransOrderId = "ORD-{$order->id}";
        $payload = [
            'transaction_details' => [
                'order_id'     => $midtransOrderId,
                'gross_amount' => (int) round($order->total), // Midtrans pakai integer
            ],
            'customer_details' => [
                'first_name' => $order->customer_name,
                'email'      => $order->customer_email,
                'phone'      => $order->customer_phone,
            ],
            'item_details' => [[
                'id'       => $order->package_code,
                'price'    => (int) round($order->total),
                'quantity' => 1,
                'name'     => "{$order->product_code} - {$order->package_code} ({$order->duration_code})",
            ]],
            // opsional: enable payment channel tertentu, callbacks, dll.
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MstDuration;
use App\Models\MstProduct;
use App\Models\MstProductPackage;
use App\Models\Order;
use App\Services\MidtransService;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(Request $req, PricingService $pricing, MidtransService $midtrans)
    {
        // validasi minimal
        $data = $req->validate([
            'product_code'   => 'required|string|exists:mst_products,product_code',
            'package_code'   => 'required|string|exists:mst_product_packages,package_code',
            'duration_code'  => 'required|string|exists:mst_durations,code',
        ]);

        // Ambil user dari auth:customer-api ---
        /** @var \App\Models\Customer|null $auth */
        $auth = auth('customer-api')->user();
        if (!$auth) {
            abort(401, 'Unauthorized');
        }

        // Ambil master product / package / duration
        $product = MstProduct::where('product_code', $data['product_code'])->first();
        if (!$product) {
            throw ValidationException::withMessages(['product_code' => 'Produk tidak ditemukan.']);
        }

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

        // Hitung harga
        $priceInfo = $pricing->resolvePrice(
            $data['product_code'],
            $data['package_code'],
            $data['duration_code'],
        );

        // Harus mengembalikan: ['pricelist_item_id','price','discount','total','currency']
        if (!isset($priceInfo['total'])) {
            abort(422, 'Tidak bisa menentukan harga untuk kombinasi ini.');
        }

        // Buat order (status pending)
        $order = new Order();
        $order->fill([
            'customer_id'        => (string) $auth->id,
            'customer_name'      => $auth->full_name,
            'customer_email'     => $auth->email,
            'customer_phone'     => $auth->phone,

            'product_code'   => $data['product_code'],
            'product_name'   => $product->product_name ?? $data['product_code'],

            'package_code'   => $data['package_code'],
            'package_name'   => $package->name ?? $data['package_code'],

            'duration_code'  => $data['duration_code'],
            'duration_name'  => $duration->name ?? $data['duration_code'],

            'pricelist_item_id'=> $priceInfo['pricelist_item_id'],

            'price'            => $priceInfo['price'],
            'discount'         => $priceInfo['discount'],
            'total'            => $priceInfo['total'],
            'currency'         => $priceInfo['currency'],

            'status'           => 'pending',
        ]);
        $order->save();

        /**
         * === Generate midtrans_order_id aman dari race: "ORD-YYYYMMDD-000001" ===
         * Counter reset per hari → key: "order:{YYYYMMDD}"
         */
        $today = now()->format('Ymd');
        $counterKey = "order:{$today}";

        $next = DB::transaction(function () use ($counterKey) {
            // lock baris counter agar atomic
            $row = DB::table('counters')->where('key', $counterKey)->lockForUpdate()->first();
            if (!$row) {
                DB::table('counters')->insert([
                    'key'        => $counterKey,
                    'value'      => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $row = (object)['value' => 0];
            }
            $next = (int) $row->value + 1;
            DB::table('counters')->where('key', $counterKey)->update([
                'value'      => $next,
                'updated_at' => now(),
            ]);
            return $next;
        });

        $sequenceSix = str_pad((string) $next, 6, '0', STR_PAD_LEFT);
        
        // Payload Midtrans
        $midtransOrderId = "ORD-{$today}-{$sequenceSix}";

        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
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
                'name'     => "{$order->product_name} - {$order->package_name} ({$order->duration_name})",
            ]],
            'callbacks' => [
                'finish' => "{$frontend}/orders/{$order->id}?status=success",
                'error'  => "{$frontend}/orders/{$order->id}?status=error",
            ],
        ];

        // Snap token
        $snapToken = $midtrans->createSnapToken($payload);

        // Simpan snapshot Midtrans
        $order->midtrans_order_id = $midtransOrderId;
        $order->snap_token        = $snapToken;
        $order->save();

        return response()->json([
            'success'   => true,
            'message'   => 'Order created',
            'data'      => [
                'order_id'   => $order->id,
                'midtrans_order_id' => $order->midtrans_order_id,
                'snap_token' => $snapToken,
                'total'      => (float) $order->total,
                'currency'   => $order->currency,
                'status'     => $order->status,
                'product' => [
                    'code' => $order->product_code,
                    'name' => $order->product_name,
                ],
                'package' => [
                    'code' => $order->package_code,
                    'name' => $order->package_name,
                ],
                'duration' => [
                    'code' => $order->duration_code,
                    'name' => $order->duration_name,
                ],
            ],
        ], 201);
    }

    // refresh status agar sinkron dengan midtrans -> db
    public function refreshStatus(string $id, MidtransService $midtrans)
    {
        /** @var \App\Models\Customer $auth */
        $auth = auth('customer-api')->user();
        if (!$auth) abort(401);

        $order = Order::findOrFail($id);

        // pastikan order milik user ini
        if ($order->customer_id !== (string)$auth->id) {
            abort(403, 'Forbidden');
        }

        // kalau sudah final, tidak usah panggil Midtrans lagi
        if ($order->status !== 'pending' || !$order->midtrans_order_id) {
            return response()->json([
                'success' => true,
                'data'    => ['status' => $order->status]
            ]);
        }

        // --- panggil Midtrans ---
        $res = $midtrans->status($order->midtrans_order_id); // stdClass dari service

        $status      = $res->transaction_status ?? null;   // settlement|capture|pending|deny|cancel|expire
        $paymentType = $res->payment_type ?? null;
        $fraudStatus = $res->fraud_status ?? null;

        // mapping status
        switch ($status) {
            case 'capture':
                if ($paymentType === 'credit_card' && $fraudStatus === 'challenge') {
                    $order->status    = 'pending';
                    $order->is_active = false;
                } else {
                    $order->status  = 'paid';
                    $order->paid_at = now();
                    // kalau mau, panggil applyActivePeriod($order) di sini
                }
                break;

            case 'settlement':
                $order->status  = 'paid';
                $order->paid_at = now();
                // applyActivePeriod($order) kalau dipakai
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
        }

        // snapshot tambahan (opsional)
        $order->payment_status = $status;
        $order->payment_type   = $paymentType;
        if (!empty($res->transaction_id)) {
            $order->midtrans_transaction_id = $res->transaction_id;
        }

        $order->save();
    }

    public function show(string $id)
    {
        $order = Order::with('customer')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'order_id'          => (string) $order->id,
                'snap_token'        => $order->snap_token,
                'status'            => $order->status,
                'currency'          => $order->currency,
                'price'             => (float) $order->price,
                'discount'          => (float) $order->discount,
                'total'             => (float) $order->total,

                'product_code'      => $order->product_code,
                'product_name'      => $order->product_name,
                'package_code'      => $order->package_code,
                'package_name'      => $order->package_name,
                'duration_code'     => $order->duration_code,
                'duration_name'     => $order->duration_name,

                'midtrans_order_id' => $order->midtrans_order_id,
                'payment_status'    => $order->payment_status,
                'payment_type'      => $order->payment_type,
                'va_number'         => $order->va_number,
                'bank'              => $order->bank,
                'permata_va_number' => $order->permata_va_number,
                'qris_data'         => $order->qris_data,
                'paid_at'           => $order->paid_at,
                'created_at'        => $order->created_at,

                'start_date'        => optional($order->start_date)->toDateString(),
                'end_date'          => optional($order->end_date)->toDateString(),
                'is_active'         => (bool) $order->is_active,              // flag DB asli
                'is_currently_active' => $order->is_currently_active,         // hasil hitung
                
                'customer'              => [
                    'id'        => (string) $order->customer_id,
                    'name'      => $order->customer_name,
                    'email'     => $order->customer_email,
                    'phone'     => $order->customer_phone,
                ],
            ],
        ]);
    }

    public function myProducts(Request $req)
    {
        /** @var \App\Models\Customer|null $auth */
        $auth = auth('customer-api')->user();
        if (!$auth) abort(401, 'Unauthorized');

        // Query dasar: order paid milik customer ini
        $q = Order::query()
            ->where('customer_id', $auth->id)
            ->where('status', 'paid')
            ->orderByDesc('paid_at')
            ->orderByDesc('created_at');

        // Optional filter: ?active=1 hanya yang masih aktif sekarang, ?active=0 hanya yang tidak aktif sekarang
        $active = $req->query('active');
        if ($active !== null) {
            $active = (string)$active === '1';
            $today = now()->toDateString();

            if ($active) {
                $q->where('is_active', true)
                ->where(function($qq) use ($today) {
                    $qq->whereNull('end_date')
                        ->orWhereDate('end_date', '>=', $today);
                });
            } else {
                // tidak aktif sekarang
                $q->where(function($qq) use ($today) {
                    $qq->where('is_active', false)
                    ->orWhere(function($qq2) use ($today) {
                        $qq2->whereNotNull('end_date')
                            ->whereDate('end_date', '<', $today);
                    });
                });
            }
        }

        $perPage = (int) $req->query('per_page', 5);
        $orders = $q->paginate($perPage);

        // Bentuk payload ringkas untuk FE “My Products”
        $items = collect($orders->items())->map(function (Order $o) {
            return [
                'order_id'           => (string) $o->id,
                'midtrans_order_id'  => $o->midtrans_order_id,
                'status'             => $o->status,               // paid (riwayat)
                'is_active'          => (bool) $o->is_active,      // flag DB
                'is_currently_active'=> $o->is_currently_active,   // hasil hitung now()
                'price'              => (float) $o->price,
                'discount'           => (float) $o->discount,
                'total'              => (float) $o->total,
                'currency'           => $o->currency,
                'start_date'         => optional($o->start_date)->toDateString(),
                'end_date'           => optional($o->end_date)->toDateString(),

                'product' => [
                    'code' => $o->product_code,
                    'name' => $o->product_name,
                ],
                'package' => [
                    'code' => $o->package_code,
                    'name' => $o->package_name,
                ],
                'duration' => [
                    'code' => $o->duration_code,
                    'name' => $o->duration_name,
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'meta'  => [
                    'current_page' => $orders->currentPage(),
                    'per_page'     => $orders->perPage(),
                    'total'        => $orders->total(),
                    'last_page'    => $orders->lastPage(),
                ],
            ],
        ]);
    }

    public function myInvoices(Request $req)
    {
        /** @var \App\Models\Customer|null $auth */
        $auth = auth('customer-api')->user();
        if (!$auth) abort(401, 'Unauthorized');

        // filter: ?status=paid|pending|failed|expired  (opsional)
        $status = $req->query('status');

        $q = Order::query()
            ->where('customer_id', $auth->id)
            // umumnya invoice ditampilkan utk order yg pernah dibuat (paid/pending/failed/expired)
            ->when($status, fn($qq) => $qq->where('status', $status))
            ->orderByDesc('paid_at')
            ->orderByDesc('created_at');

        $perPage = (int) $req->query('per_page', 10);
        $orders  = $q->paginate($perPage);

        $items = collect($orders->items())->map(function (Order $o) {
            $date = $o->paid_at ?: $o->created_at;

            return [
                'order_id'          => (string) $o->id,
                'midtrans_order_id' => $o->midtrans_order_id,            // "INV-20250115-000123"
                'date'              => optional($date)->toDateString(),    // 2025-01-15
                'product_name'      => $o->product_name ?: $o->product_code,
                'package_name'      => $o->package_name ?: $o->package_code,
                'amount'            => (float) $o->total,
                'currency'          => $o->currency,
                'status'            => $o->status,                         // paid|pending|failed|expired
                // 'download_url'      => route('customer.invoice.download', ['id' => $o->id]),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'meta'  => [
                    'current_page' => $orders->currentPage(),
                    'per_page'     => $orders->perPage(),
                    'total'        => $orders->total(),
                    'last_page'    => $orders->lastPage(),
                ],
            ],
        ]);
    }
}

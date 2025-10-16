<?php

namespace App\Http\Controllers;

use App\Models\MstDuration;
use App\Models\MstProduct;
use App\Models\MstProductPackage;
use App\Models\Order;
use App\Models\Subscription;
use App\Services\AddonService;
use App\Services\MidtransService;
use App\Services\PeriodService;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    // Order baru
    public function purchase(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period)
    {
        return $this->createOrder($req, $pricing, $midtrans, $period, 'purchase');
    }

    // Perpanjangan (Renewal)
    public function renew(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period)
    {
        return $this->createOrder($req, $pricing, $midtrans, $period, 'renew');
    }

    // Upgrade paket
    public function upgrade(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period)
    {
        return $this->createOrder($req, $pricing, $midtrans, $period, 'upgrade');
    }

    private function createOrder(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period, string $intent)
    {
        $data = $req->validate([
            'product_code'   => 'required|string|exists:mst_products,product_code',
            'package_code'   => 'required|string|exists:mst_product_packages,package_code',
            'duration_code'  => 'required|string|exists:mst_durations,code',
            'base_order_id'  => 'nullable|uuid|exists:orders,id',
        ]);

        $auth = auth('customer-api')->user(); if (!$auth) abort(401,'Unauthorized');

        $baseOrder = null;
        if (in_array($intent, ['renew','upgrade'])) {
            $baseOrder = Order::findOrFail($data['base_order_id']);
            if ((string)$baseOrder->customer_id !== (string)$auth->id) {
                throw ValidationException::withMessages(['base_order_id' => 'Order lama bukan milik Anda.']);
            }
            if ($baseOrder->status !== 'paid') {
                throw ValidationException::withMessages(['base_order_id' => 'Order lama tidak valid untuk '.$intent]);
            }
        }

        if ($intent === 'renew') {
            if ($baseOrder->product_code !== $data['product_code']) {
                throw ValidationException::withMessages(['product_code' => ['Product tidak sama dengan base_order_id.']]);
            }
            if ($baseOrder->package_code !== $data['package_code']) {
                throw ValidationException::withMessages(['package_code' => ['Renew tidak boleh ganti paket. Gunakan upgrade.']]);
            }
        }
        if ($intent === 'upgrade') {
            if ($baseOrder->product_code !== $data['product_code']) {
                throw ValidationException::withMessages(['product_code' => ['Product tidak sama dengan base_order_id.']]);
            }
        }

        $product = MstProduct::where('product_code',$data['product_code'])->first();
        if (!$product) throw ValidationException::withMessages(['product_code'=>'Produk tidak ditemukan.']);

        $package = MstProductPackage::where('package_code',$data['package_code'])
                  ->where('product_code',$data['product_code'])->first();
        if (!$package) throw ValidationException::withMessages(['package_code'=>'Paket tidak sesuai produk.']);

        $duration = MstDuration::where('code',$data['duration_code'])->first();
        if (!$duration) throw ValidationException::withMessages(['duration_code'=>'Durasi tidak valid.']);

        $today = now()->toDateString();
        $lastActiveForProduct = Order::query()
            ->where('customer_id', $auth->id)
            ->where('product_code', $data['product_code'])
            ->where('status', 'paid')
            ->where('is_active', true)
            ->where(fn($q)=>$q->whereNull('end_date')->orWhereDate('end_date','>=',$today))
            ->orderByDesc('end_date')->first();

        ['start_date'=>$start,'end_date'=>$end] = $period->compute($intent,$baseOrder,$duration);

        $priceInfo = $pricing->resolvePrice($data['product_code'],$data['package_code'],$data['duration_code'],$intent,$baseOrder?->id);
        if (!isset($priceInfo['total'])) abort(422,'Tidak bisa menentukan harga.');

        $subscriptionInstanceId = $intent==='purchase'
            ? (string) Str::uuid()
            : (data_get($baseOrder,'meta.subscription_instance_id') ?: ($lastActiveForProduct?->meta['subscription_instance_id'] ?? null));

        $order = new Order();
        $order->fill([
            'customer_id'   => (string)$auth->id,
            'customer_name' => $auth->full_name,
            'customer_email'=> $auth->email,
            'customer_phone'=> $auth->phone,

            'product_code'  => $data['product_code'],
            'product_name'  => $product->product_name ?? $data['product_code'],
            'package_code'  => $data['package_code'],
            'package_name'  => $package->name ?? $data['package_code'],
            'duration_code' => $data['duration_code'],
            'duration_name' => $duration->name ?? $data['duration_code'],

            'pricelist_item_id'=> $priceInfo['pricelist_item_id'],
            'price'            => $priceInfo['price'],
            'discount'         => $priceInfo['discount'],
            'total'            => $priceInfo['total'],
            'currency'         => $priceInfo['currency'],

            'start_date'   => $start,
            'end_date'     => $end,
            'is_active'    => false,
            'status'       => 'pending',
            'intent'       => $intent,
            'base_order_id'=> $baseOrder?->id,
        ]);
        $order->save();

        $midtransOrderId = $this->nextMidtransOrderId('ORD');

        $frontend = rtrim(env('FRONTEND_URL','http://localhost:3000'),'/');
        $payload = [
            'transaction_details' => ['order_id'=>$midtransOrderId,'gross_amount'=>(int)round($order->total)],
            'customer_details'    => ['first_name'=>$order->customer_name,'email'=>$order->customer_email,'phone'=>$order->customer_phone],
            'item_details'        => [[
                'id'=>$order->package_code,'price'=>(int)round($order->total),'quantity'=>1,
                'name'=>"{$order->product_name} - {$order->package_name} ({$order->duration_name})",
            ]],
            'callbacks' => [
                'finish'=>"$frontend/orders/{$order->id}?status=success",
                'error' =>"$frontend/orders/{$order->id}?status=error",
            ],
        ];
        $snapToken = app(MidtransService::class)->createSnapToken($payload);

        $order->midtrans_order_id = $midtransOrderId;
        $order->snap_token        = $snapToken;
        $order->meta = array_merge($order->meta ?? [], [
            'subscription_instance_id' => $subscriptionInstanceId,
        ]);
        $order->save();

        return response()->json([
            'success'=>true,'message'=>'Order created','data'=>[
                'order_id'=>$order->id,'midtrans_order_id'=>$order->midtrans_order_id,'snap_token'=>$snapToken,
                'total'=>(float)$order->total,'currency'=>$order->currency,'status'=>$order->status,'intent'=>$order->intent,
                'base_order_id'=>$order->base_order_id,
                'start_date'=>optional($order->start_date)->toDateString(),'end_date'=>optional($order->end_date)->toDateString(),
                'product'=>['code'=>$order->product_code,'name'=>$order->product_name],
                'package'=>['code'=>$order->package_code,'name'=>$order->package_name],
                'duration'=>['code'=>$order->duration_code,'name'=>$order->duration_name],
            ]
        ],201);
    }

    // ================== NEW: ADD-ON ==================
    public function addon(Request $req, AddonService $svc, MidtransService $midtrans)
    {
        $data = $req->validate([
            'product_code' => 'required|string|exists:mst_products,product_code',
            'features'     => 'required|array|min:1',
            'features.*'   => 'string',
            'subscription_instance_id' => 'nullable|uuid',
        ]);

        $auth = auth('customer-api')->user(); if (!$auth) abort(401);

        // cek subscription aktif utk ambil paket
        $sub = Subscription::query()
            ->where('customer_id',$auth->id)
            ->where('product_code',$data['product_code'])
            ->where('is_active',true)
            ->orderByDesc('end_date')->orderByDesc('created_at')
            ->first();
        if (!$sub) throw ValidationException::withMessages([
            'product_code'=>['Anda belum punya langganan aktif untuk produk ini.']
        ]);

        $instanceId = $data['subscription_instance_id']
            ?? $this->resolveInstanceIdForCustomerProduct((string)$auth->id, $data['product_code']);
        if (!$instanceId) throw ValidationException::withMessages([
            'subscription_instance_id'=>['Tidak bisa menemukan instance aktif untuk produk ini.']
        ]);

        // Ambil PARENT yang sudah dibeli sebelumnya (pakai meta.features = parent codes)
        $boughtParents = Order::query()
            ->where('customer_id',$auth->id)
            ->where('product_code',$data['product_code'])
            ->where('intent','addon')->where('status','paid')
            ->where('meta->subscription_instance_id',$instanceId)
            ->get(['meta'])
            ->flatMap(function (Order $o) {
                $m = $o->meta;
                if (is_string($m)) $m = json_decode($m, true) ?: [];
                $arr = data_get($m, 'features', []);
                return is_array($arr) ? $arr : [];
            })
            ->unique()->values()->all();

        // Resolve hierarki
        $res = $svc->resolvePayableHierarchical(
            productCode: $data['product_code'],
            packageCode: $sub->current_package_code,
            wanted:      $data['features'],
            alreadyBoughtParentCodes: $boughtParents
        );

        if (empty($res['lines'])) {
            throw ValidationException::withMessages([
                'features'=>['Semua pilihan sudah termasuk paket atau sudah Anda beli.']
            ]);
        }

        // Buat order
        $order = new Order();
        $order->fill([
            'customer_id'    => (string)$auth->id,
            'customer_name'  => $auth->full_name,
            'customer_email' => $auth->email,
            'customer_phone' => $auth->phone,

            'product_code'   => $sub->product_code,
            'product_name'   => $sub->product_name,
            'package_code'   => $sub->current_package_code,
            'package_name'   => $sub->current_package_name,

            'duration_code'  => null, 'duration_name'=> null,
            'price'          => $res['total'],
            'discount'       => 0,
            'total'          => $res['total'],
            'currency'       => 'IDR',

            'start_date'     => null,
            'end_date'       => null,
            'is_active'      => false,
            'status'         => 'pending',
            'intent'         => 'addon',
        ]);
        $order->meta = array_merge($order->meta ?? [], [
            'subscription_instance_id' => $instanceId,
            'features'         => $res['payable_parents'], // SIMPAN parent yg dibeli
            'grant_features'   => $res['grant_features'],  // parent+children (untuk warehouse)
            'lines'            => $res['lines'],           // untuk kurasi Midtrans
        ]);
        $order->save();

        // Midtrans
        $midId = $this->nextMidtransOrderId('ORD');
        $payload = [
            'transaction_details' => ['order_id'=>$midId,'gross_amount'=>(int)$order->total],
            'customer_details'    => ['first_name'=>$order->customer_name,'email'=>$order->customer_email,'phone'=>$order->customer_phone],
            'item_details'        => $svc->midtransItems($res['lines']),  // HANYA parent
            'callbacks'           => [
                'finish'=>rtrim(env('FRONTEND_URL','http://localhost:3000'),'/')."/orders/{$order->id}?intent=addon&status=success",
                'error' =>rtrim(env('FRONTEND_URL','http://localhost:3000'),'/')."/orders/{$order->id}?intent=addon&status=error",
            ],
        ];

        \Log::info('ADDON ORDER', [
            'order_id' => (string)$order->id,
            'parents'  => $res['payable_parents'],
            'grant'    => $res['grant_features'],
            'total'    => $res['total'],
        ]);
        $snap = $midtrans->createSnapToken($payload);
        $order->midtrans_order_id = $midId;
        $order->snap_token        = $snap;
        $order->save();

        return response()->json(['success'=>true,'data'=>[
            'order_id'=>(string)$order->id,
            'snap_token'=>$snap,
            'total'=>(int)$order->total
        ]], 201);
    }

    // ===== status + trigger notify job =====
    public function refreshStatus(string $id, MidtransService $midtrans)
    {
        $auth = auth('customer-api')->user(); if (!$auth) abort(401);
        $order = Order::findOrFail($id);
        if ($order->customer_id !== (string)$auth->id) abort(403,'Forbidden');

        if ($order->status !== 'pending' || !$order->midtrans_order_id) {
            return response()->json(['success'=>true,'data'=>['status'=>$order->status]]);
        }

        $res = $midtrans->status($order->midtrans_order_id);
        $status      = $res->transaction_status ?? null;
        $paymentType = $res->payment_type ?? null;
        $fraudStatus = $res->fraud_status ?? null;

        switch ($status) {
            case 'capture':
                if ($paymentType==='credit_card' && $fraudStatus==='challenge') {
                    $order->status='pending'; $order->is_active=false;
                } else { $order->status='paid'; $order->paid_at=now(); }
                break;
            case 'settlement': $order->status='paid'; $order->paid_at=now(); break;
            case 'pending':    $order->status='pending'; $order->is_active=false; break;
            case 'deny':
            case 'cancel':     $order->status='failed';  $order->is_active=false; break;
            case 'expire':     $order->status='expired'; $order->is_active=false; break;
        }

        $order->payment_status = $status;
        $order->payment_type   = $paymentType;
        if (!empty($res->transaction_id)) $order->midtrans_transaction_id = $res->transaction_id;
        $order->save();

        // trigger provisioning once
        if ($order->status==='paid' && !$order->provision_notified_at) {
            dispatch(new \App\Jobs\NotifyWarehouseJob((string)$order->id))
                ->onQueue('provisioning');
        }

        return response()->json(['success'=>true,'data'=>['status'=>$order->status]]);
    }

    public function show(string $id)
    {
        $order = Order::with('customer')->findOrFail($id);

        return response()->json([
            'success'=>true,
            'data'=>[
                'order_id'=>(string)$order->id,
                'snap_token'=>$order->snap_token,
                'status'=>$order->status,
                'currency'=>$order->currency,
                'price'=>(float)$order->price,
                'discount'=>(float)$order->discount,
                'total'=>(float)$order->total,
                'product_code'=>$order->product_code,
                'product_name'=>$order->product_name,
                'package_code'=>$order->package_code,
                'package_name'=>$order->package_name,
                'duration_code'=>$order->duration_code,
                'duration_name'=>$order->duration_name,
                'intent'=>$order->intent,
                'base_order_id'=>$order->base_order_id,
                'midtrans_order_id'=>$order->midtrans_order_id,
                'payment_status'=>$order->payment_status,
                'payment_type'=>$order->payment_type,
                'va_number'=>$order->va_number,
                'bank'=>$order->bank,
                'permata_va_number'=>$order->permata_va_number,
                'qris_data'=>$order->qris_data,
                'paid_at'=>$order->paid_at,
                'created_at'=>$order->created_at,
                'start_date'=>optional($order->start_date)->toDateString(),
                'end_date'=>optional($order->end_date)->toDateString(),
                'is_active'=>(bool)$order->is_active,
                'is_currently_active'=>$order->is_currently_active,
                'customer'=>[
                    'id'=>(string)$order->customer_id,
                    'name'=>$order->customer_name,
                    'email'=>$order->customer_email,
                    'phone'=>$order->customer_phone,
                ],
            ]
        ]);
    }

    public function myProducts(Request $req)
    {
        $auth = auth('customer-api')->user(); if (!$auth) abort(401);
        $q = Order::query()
            ->where('customer_id',$auth->id)->where('status','paid')
            ->whereIn('intent',['purchase','renew','upgrade']) // exclude addon
            ->orderByDesc('paid_at')->orderByDesc('created_at');

        $active = $req->query('active');
        if ($active !== null) {
            $active = (string)$active === '1';
            $today = now()->toDateString();
            if ($active) {
                $q->where('is_active',true)
                  ->where(fn($qq)=>$qq->whereNull('end_date')->orWhereDate('end_date','>=',$today));
            } else {
                $q->where(fn($qq)=>$qq->where('is_active',false)
                    ->orWhere(fn($qq2)=>$qq2->whereNotNull('end_date')->whereDate('end_date','<',$today)));
            }
        }
        $orders = $q->paginate((int)$req->query('per_page',5));

        $items = collect($orders->items())->map(function (Order $o) {
            return [
                'order_id'=>(string)$o->id,
                'midtrans_order_id'=>$o->midtrans_order_id,
                'status'=>$o->status,
                'is_active'=>(bool)$o->is_active,
                'is_currently_active'=>$o->is_currently_active,
                'price'=>(float)$o->price,
                'discount'=>(float)$o->discount,
                'total'=>(float)$o->total,
                'currency'=>$o->currency,
                'start_date'=>optional($o->start_date)->toDateString(),
                'end_date'=>optional($o->end_date)->toDateString(),
                'product'=>['code'=>$o->product_code,'name'=>$o->product_name],
                'package'=>['code'=>$o->package_code,'name'=>$o->package_name],
                'duration'=>['code'=>$o->duration_code,'name'=>$o->duration_name],
                'intent'=>$o->intent,
                'base_order_id'=>$o->base_order_id,
            ];
        });

        return response()->json(['success'=>true,'data'=>[
            'items'=>$items,
            'meta'=>[
                'current_page'=>$orders->currentPage(),
                'per_page'=>$orders->perPage(),
                'total'=>$orders->total(),
                'last_page'=>$orders->lastPage(),
            ]
        ]]);
    }

    public function myInvoices(Request $req)
    {
        $auth = auth('customer-api')->user(); if (!$auth) abort(401);
        $status = $req->query('status');

        $q = Order::query()
            ->where('customer_id',$auth->id)
            ->when($status, fn($qq)=>$qq->where('status',$status))
            ->orderByDesc('created_at');

        $orders = $q->paginate((int)$req->query('per_page',10));

        $items = collect($orders->items())->map(function (Order $o) {
            $date = $o->paid_at ?: $o->created_at;
            return [
                'order_id'=>(string)$o->id,
                'midtrans_order_id'=>$o->midtrans_order_id,
                'date'=>optional($date)->toDateString(),
                'product_name'=>$o->product_name ?: $o->product_code,
                'package_name'=>$o->package_name ?: $o->package_code,
                'amount'=>(float)$o->total,
                'currency'=>$o->currency,
                'status'=>$o->status,
                'intent'=>$o->intent,
                'end_date'=>$o->end_date,
            ];
        });

        return response()->json(['success'=>true,'data'=>[
            'items'=>$items,
            'meta'=>[
                'current_page'=>$orders->currentPage(),
                'per_page'=>$orders->perPage(),
                'total'=>$orders->total(),
                'last_page'=>$orders->lastPage(),
            ],
        ]]);
    }

    public function mySubscriptions(Request $req)
    {
        $auth = auth('customer-api')->user(); if (!$auth) abort(401);

        $q = Subscription::where('customer_id',$auth->id)->orderBy('product_code');
        if ((string)$req->query('active','')==='1') $q->currentlyActive();

        $subs = $q->paginate((int)$req->query('per_page',5));

        $items = collect($subs->items())->map(function (Subscription $s) {
            return [
                'subscription_id'=>(string)$s->id,
                'product'=>['code'=>$s->product_code,'name'=>$s->product_name],
                'package'=>['code'=>$s->current_package_code,'name'=>$s->current_package_name],
                'duration'=>['code'=>$s->duration_code,'name'=>$s->duration_name],
                'start_date'=>optional($s->start_date)->toDateString(),
                'end_date'=>optional($s->end_date)->toDateString(),
                'is_active'=>(bool)$s->is_active,
                'is_currently_active'=>$s->is_currently_active,
                'status'=>$s->status,
                'meta'=>$s->meta,
            ];
        });

        return response()->json(['success'=>true,'data'=>[
            'items'=>$items,
            'meta'=>[
                'current_page'=>$subs->currentPage(),
                'per_page'=>$subs->perPage(),
                'total'=>$subs->total(),
                'last_page'=>$subs->lastPage(),
            ]
        ]]);
    }

    // resolve instance id dari order paid aktif
    protected function resolveInstanceIdForCustomerProduct(string $customerId, string $productCode): ?string
    {
        $today = now()->toDateString();
        $last = Order::query()
            ->where('customer_id',$customerId)
            ->where('product_code',$productCode)
            ->where('status','paid')
            ->where('is_active',true)
            ->where(fn($q)=>$q->whereNull('end_date')->orWhereDate('end_date','>=',$today))
            ->orderByDesc('end_date')->orderByDesc('paid_at')->first();

        return $last?->meta['subscription_instance_id'] ?? null;
    }

    // counter harian untuk midtrans_order_id
    private function nextMidtransOrderId(string $prefix='ORD'): string
    {
        $today = now()->format('Ymd');
        $counterKey = "order:{$today}";
        $next = DB::transaction(function () use ($counterKey) {
            $row = DB::table('counters')->where('key',$counterKey)->lockForUpdate()->first();
            if (!$row) {
                DB::table('counters')->insert(['key'=>$counterKey,'value'=>0,'created_at'=>now(),'updated_at'=>now()]);
                $row = (object)['value'=>0];
            }
            $n = (int)$row->value + 1;
            DB::table('counters')->where('key',$counterKey)->update(['value'=>$n,'updated_at'=>now()]);
            return $n;
        });
        return "{$prefix}-{$today}-".str_pad((string)$next,6,'0',STR_PAD_LEFT);
    }
}

// namespace App\Http\Controllers;

// use App\Models\Customer;
// use App\Models\MstDuration;
// use App\Models\MstProduct;
// use App\Models\MstProductPackage;
// use App\Models\Order;
// use App\Models\Subscription;
// use App\Services\MidtransService;
// use App\Services\PeriodService;
// use App\Services\PricingService;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Str;
// use Illuminate\Validation\ValidationException;

// class OrderController extends Controller
// {
//     // Order baru
//     public function purchase(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period)
//     {
//         return $this->createOrder($req, $pricing, $midtrans, $period, 'purchase');
//     }

//     // Perpanjangan (Renewal)
//     public function renew(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period)
//     {
//         return $this->createOrder($req, $pricing, $midtrans, $period, 'renew');
//     }

//     // Upgrade paket
//     public function upgrade(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period)
//     {
//         return $this->createOrder($req, $pricing, $midtrans, $period, 'upgrade');
//     }

//     private function createOrder(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period, string $intent)
//     {
//         // validasi minimal
//         $data = $req->validate([
//             'product_code'   => 'required|string|exists:mst_products,product_code',
//             'package_code'   => 'required|string|exists:mst_product_packages,package_code',
//             'duration_code'  => 'required|string|exists:mst_durations,code',
//             'base_order_id'  => 'nullable|uuid|exists:orders,id',
//         ]);

//         // Ambil user dari auth:customer-api
//         /** @var \App\Models\Customer|null $auth */
//         $auth = auth('customer-api')->user();
//         if (!$auth) {
//             abort(401, 'Unauthorized');
//         }

//         // ambil base_order untuk renew/upgrade + pastikan milik customer ini
//         $baseOrder = null;
//         if (in_array($intent, ['renew','upgrade'])) {
//             $baseOrder = Order::findOrFail($data['base_order_id']);
//             if ((string)$baseOrder->customer_id !== (string)$auth->id) {
//                 throw ValidationException::withMessages(['base_order_id' => 'Order lama bukan milik Anda.']);
//             }
//             if ($baseOrder->status !== 'paid') {
//                 throw ValidationException::withMessages(['base_order_id' => 'Order lama tidak valid untuk ' . $intent]);
//             }
//         }

//         // konsistensi RENEW: product & package harus sama
//         if ($intent === 'renew') {
//             if ($baseOrder->product_code !== $data['product_code']) {
//                 throw ValidationException::withMessages(['product_code' => ['Product tidak sama dengan base_order_id.']]);
//             }
//             if ($baseOrder->package_code !== $data['package_code']) {
//                 throw ValidationException::withMessages(['package_code' => ['Renew tidak boleh ganti paket. Silakan gunakan upgrade.']]);
//             }
//         }

//         // Konsistensi UPGRADE: product harus sama
//         if ($intent === 'upgrade') {
//             if ($baseOrder->product_code !== $data['product_code']) {
//                 throw ValidationException::withMessages([
//                     'product_code' => ['Product tidak sama dengan base_order_id.'],
//                 ]);
//             }
//         }

//         // Ambil master product / package / duration
//         $product = MstProduct::where('product_code', $data['product_code'])->first();
//         if (!$product) {
//             throw ValidationException::withMessages(['product_code' => 'Produk tidak ditemukan.']);
//         }

//         // Validasi paket sesuai product_code
//         $package = MstProductPackage::where('package_code', $data['package_code'])
//             ->where('product_code', $data['product_code'])
//             ->first();

//         if (!$package) {
//             throw ValidationException::withMessages([
//                 'package_code' => 'Paket tidak sesuai dengan produk yang dipilih.',
//             ]);
//         }

//         // Validasi duration
//         $duration = MstDuration::where('code', $data['duration_code'])->first();
//         if (!$duration) {
//             throw ValidationException::withMessages([
//                 'duration_code' => 'Durasi tidak valid.',
//             ]);
//         }

//         // cari order aktif terakhir untuk product ini (dipakai guard & period)
//         $today = now()->toDateString();
//         $lastActiveForProduct = Order::query()
//             ->where('customer_id', $auth->id)
//             ->where('product_code', $data['product_code'])
//             ->where('status', 'paid')
//             ->where('is_active', true)
//             ->where(function ($q) use ($today) {
//                 $q->whereNull('end_date')->orWhereDate('end_date', '>=', $today);
//             })
//             ->orderByDesc('end_date')
//             ->first();

//         // guard sesuai intent (dapat diaktifkan jika mau customer hanya bisa order 1 product, paket, durasi yg sama)
//         // if ($intent === 'purchase') {
//         //     if ($lastActiveForProduct && $lastActiveForProduct->package_code === $data['package_code']) {
//         //         throw ValidationException::withMessages([
//         //             'product_code' => 'Anda sudah memiliki langganan aktif untuk produk/paket ini. Gunakan Renew.',
//         //         ]);
//         //     }
//         // }

//         // periode aktif (fix bug: purchase selalu start TODAY, renew menumpuk)
//         ['start_date' => $start, 'end_date' => $end] = $period->compute($intent, $baseOrder, $duration);
        
//         // Hitung harga
//         $priceInfo = $pricing->resolvePrice(
//             $data['product_code'],
//             $data['package_code'],
//             $data['duration_code'],
//             $intent,
//             $baseOrder?->id
//         );

//         // Harus mengembalikan: ['pricelist_item_id','price','discount','total','currency']
//         if (!isset($priceInfo['total'])) {
//             abort(422, 'Tidak bisa menentukan harga untuk kombinasi ini.');
//         }

//         // tentukan subscription_instance_id
//         $subscriptionInstanceId = null;
//         if ($intent === 'purchase') {
//             // order pertama → generate id sementara
//             $subscriptionInstanceId = (string) Str::uuid();
//         } else {
//             // renew/upgrade → warisi dari base_order
//             $subscriptionInstanceId = data_get($baseOrder, 'meta.subscription_instance_id');

//             // (opsional fallback) kalau masih kosong, coba ambil dari last paid aktif product ini
//             if (!$subscriptionInstanceId && $lastActiveForProduct) {
//                 $subscriptionInstanceId = data_get($lastActiveForProduct, 'meta.subscription_instance_id');
//             }
//         }

//         // Buat order (status pending)
//         $order = new Order();
//         $order->fill([
//             'customer_id'        => (string) $auth->id,
//             'customer_name'      => $auth->full_name,
//             'customer_email'     => $auth->email,
//             'customer_phone'     => $auth->phone,

//             'product_code'   => $data['product_code'],
//             'product_name'   => $product->product_name ?? $data['product_code'],

//             'package_code'   => $data['package_code'],
//             'package_name'   => $package->name ?? $data['package_code'],

//             'duration_code'  => $data['duration_code'],
//             'duration_name'  => $duration->name ?? $data['duration_code'],

//             'pricelist_item_id'=> $priceInfo['pricelist_item_id'],
//             'price'            => $priceInfo['price'],
//             'discount'         => $priceInfo['discount'],
//             'total'            => $priceInfo['total'],
//             'currency'         => $priceInfo['currency'],

//             'start_date'         => $start,
//             'end_date'           => $end,
//             'is_active'          => false,

//             'status'           => 'pending',

//             'intent'             => $intent,    // purchase/renew/upgrade
//             'base_order_id'      => $baseOrder?->id,
//         ]);
//         $order->save();

//         /**
//          * Generate midtrans_order_id aman dari race: "ORD-YYYYMMDD-000001"
//          * Counter reset per hari → key: "order:{YYYYMMDD}"
//          */
//         $today = now()->format('Ymd');
//         $counterKey = "order:{$today}";

//         $next = DB::transaction(function () use ($counterKey) {
//             // lock baris counter agar atomic
//             $row = DB::table('counters')->where('key', $counterKey)->lockForUpdate()->first();
//             if (!$row) {
//                 DB::table('counters')->insert([
//                     'key'        => $counterKey,
//                     'value'      => 0,
//                     'created_at' => now(),
//                     'updated_at' => now(),
//                 ]);
//                 $row = (object)['value' => 0];
//             }
//             $next = (int) $row->value + 1;
//             DB::table('counters')->where('key', $counterKey)->update([
//                 'value'      => $next,
//                 'updated_at' => now(),
//             ]);
//             return $next;
//         });

//         $sequenceSix = str_pad((string) $next, 6, '0', STR_PAD_LEFT);
        
//         // Payload Midtrans
//         $midtransOrderId = "ORD-{$today}-{$sequenceSix}";

//         $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
//         $payload = [
//             'transaction_details' => [
//                 'order_id'     => $midtransOrderId,
//                 'gross_amount' => (int) round($order->total), // Midtrans pakai integer
//             ],
//             'customer_details' => [
//                 'first_name' => $order->customer_name,
//                 'email'      => $order->customer_email,
//                 'phone'      => $order->customer_phone,
//             ],
//             'item_details' => [[
//                 'id'       => $order->package_code,
//                 'price'    => (int) round($order->total),
//                 'quantity' => 1,
//                 'name'     => "{$order->product_name} - {$order->package_name} ({$order->duration_name})",
//             ]],
//             'callbacks' => [
//                 'finish' => "{$frontend}/orders/{$order->id}?status=success",
//                 'error'  => "{$frontend}/orders/{$order->id}?status=error",
//             ],
//         ];

//         // Snap token
//         $snapToken = $midtrans->createSnapToken($payload);

//         // Simpan snapshot Midtrans
//         $order->midtrans_order_id = $midtransOrderId;
//         $order->snap_token        = $snapToken;

//         // tentukan subscription_instance_id
//         $subscriptionId = $order->meta['subscription_instance_id']
//             ?? ($baseOrder?->meta['subscription_instance_id']
//             ?? ($intent === 'purchase' ? (string) Str::uuid() : null));

//         $order->meta = array_merge($order->meta ?? [], [
//             'subscription_instance_id' => $subscriptionId,
//         ]);

//         $order->save();

//         return response()->json([
//             'success'   => true,
//             'message'   => 'Order created',
//             'data'      => [
//                 'order_id'          => $order->id,
//                 'midtrans_order_id' => $order->midtrans_order_id,
//                 'snap_token'        => $snapToken,
//                 'total'             => (float) $order->total,
//                 'currency'          => $order->currency,
//                 'status'            => $order->status,
//                 'intent'            => $order->intent,
//                 'base_order_id'     => $order->base_order_id,
//                 'start_date'        => optional($order->start_date)->toDateString(),
//                 'end_date'          => optional($order->end_date)->toDateString(),
//                 'product'  => [
//                     'code' => $order->product_code,
//                     'name' => $order->product_name,
//                 ],
//                 'package'  => [
//                     'code' => $order->package_code,
//                     'name' => $order->package_name,
//                 ],
//                 'duration' => [
//                     'code' => $order->duration_code,
//                     'name' => $order->duration_name,
//                 ],
//             ],
//         ], 201);
//     }

//     // refresh status agar sinkron dengan midtrans -> db
//     public function refreshStatus(string $id, MidtransService $midtrans)
//     {
//         /** @var \App\Models\Customer $auth */
//         $auth = auth('customer-api')->user();
//         if (!$auth) abort(401);

//         $order = Order::findOrFail($id);

//         // pastikan order milik user ini
//         if ($order->customer_id !== (string)$auth->id) {
//             abort(403, 'Forbidden');
//         }

//         // kalau sudah final, tidak usah panggil Midtrans lagi
//         if ($order->status !== 'pending' || !$order->midtrans_order_id) {
//             return response()->json([
//                 'success' => true,
//                 'data'    => ['status' => $order->status]
//             ]);
//         }

//         // --- panggil Midtrans ---
//         $res = $midtrans->status($order->midtrans_order_id); // stdClass dari service

//         $status      = $res->transaction_status ?? null;   // settlement|capture|pending|deny|cancel|expire
//         $paymentType = $res->payment_type ?? null;
//         $fraudStatus = $res->fraud_status ?? null;

//         // mapping status
//         switch ($status) {
//             case 'capture':
//                 if ($paymentType === 'credit_card' && $fraudStatus === 'challenge') {
//                     $order->status    = 'pending';
//                     $order->is_active = false;
//                 } else {
//                     $order->status  = 'paid';
//                     $order->paid_at = now();
//                 }
//                 break;

//             case 'settlement':
//                 $order->status  = 'paid';
//                 $order->paid_at = now();
//                 break;

//             case 'pending':
//                 $order->status    = 'pending';
//                 $order->is_active = false;
//                 break;

//             case 'deny':
//             case 'cancel':
//                 $order->status    = 'failed';
//                 $order->is_active = false;
//                 break;

//             case 'expire':
//                 $order->status    = 'expired';
//                 $order->is_active = false;
//                 break;
//         }

//         // snapshot tambahan (opsional)
//         $order->payment_status = $status;
//         $order->payment_type   = $paymentType;
//         if (!empty($res->transaction_id)) {
//             $order->midtrans_transaction_id = $res->transaction_id;
//         }

//         $order->save();
//     }

//     public function show(string $id)
//     {
//         $order = Order::with('customer')->findOrFail($id);

//         return response()->json([
//             'success' => true,
//             'data'    => [
//                 'order_id'          => (string) $order->id,
//                 'snap_token'        => $order->snap_token,
//                 'status'            => $order->status,
//                 'currency'          => $order->currency,
//                 'price'             => (float) $order->price,
//                 'discount'          => (float) $order->discount,
//                 'total'             => (float) $order->total,

//                 'product_code'      => $order->product_code,
//                 'product_name'      => $order->product_name,
//                 'package_code'      => $order->package_code,
//                 'package_name'      => $order->package_name,
//                 'duration_code'     => $order->duration_code,
//                 'duration_name'     => $order->duration_name,

//                 'intent'            => $order->intent,
//                 'base_order_id'     => $order->base_order_id,

//                 'midtrans_order_id' => $order->midtrans_order_id,
//                 'payment_status'    => $order->payment_status,
//                 'payment_type'      => $order->payment_type,
//                 'va_number'         => $order->va_number,
//                 'bank'              => $order->bank,
//                 'permata_va_number' => $order->permata_va_number,
//                 'qris_data'         => $order->qris_data,
//                 'paid_at'           => $order->paid_at,
//                 'created_at'        => $order->created_at,

//                 'start_date'        => optional($order->start_date)->toDateString(),
//                 'end_date'          => optional($order->end_date)->toDateString(),
//                 'is_active'         => (bool) $order->is_active,              // flag DB asli
//                 'is_currently_active' => $order->is_currently_active,         // hasil hitung
                
//                 'customer'              => [
//                     'id'        => (string) $order->customer_id,
//                     'name'      => $order->customer_name,
//                     'email'     => $order->customer_email,
//                     'phone'     => $order->customer_phone,
//                 ],
//             ],
//         ]);
//     }

//     public function myProducts(Request $req)
//     {
//         /** @var \App\Models\Customer|null $auth */
//         $auth = auth('customer-api')->user();
//         if (!$auth) abort(401, 'Unauthorized');

//         // Query dasar: order paid milik customer ini
//         $q = Order::query()
//             ->where('customer_id', $auth->id)
//             ->where('status', 'paid')
//             ->orderByDesc('paid_at')
//             ->orderByDesc('created_at');

//         // Optional filter: ?active=1 hanya yang masih aktif sekarang, ?active=0 hanya yang tidak aktif sekarang
//         $active = $req->query('active');
//         if ($active !== null) {
//             $active = (string)$active === '1';
//             $today = now()->toDateString();

//             if ($active) {
//                 $q->where('is_active', true)
//                 ->where(function($qq) use ($today) {
//                     $qq->whereNull('end_date')
//                         ->orWhereDate('end_date', '>=', $today);
//                 });
//             } else {
//                 // tidak aktif sekarang
//                 $q->where(function($qq) use ($today) {
//                     $qq->where('is_active', false)
//                     ->orWhere(function($qq2) use ($today) {
//                         $qq2->whereNotNull('end_date')
//                             ->whereDate('end_date', '<', $today);
//                     });
//                 });
//             }
//         }

//         $perPage = (int) $req->query('per_page', 5);
//         $orders = $q->paginate($perPage);

//         // Bentuk payload ringkas untuk FE “My Products”
//         $items = collect($orders->items())->map(function (Order $o) {
//             return [
//                 'order_id'           => (string) $o->id,
//                 'midtrans_order_id'  => $o->midtrans_order_id,
//                 'status'             => $o->status,               // paid (riwayat)
//                 'is_active'          => (bool) $o->is_active,      // flag DB
//                 'is_currently_active'=> $o->is_currently_active,   // hasil hitung now()
//                 'price'              => (float) $o->price,
//                 'discount'           => (float) $o->discount,
//                 'total'              => (float) $o->total,
//                 'currency'           => $o->currency,
//                 'start_date'         => optional($o->start_date)->toDateString(),
//                 'end_date'           => optional($o->end_date)->toDateString(),

//                 'product' => [
//                     'code' => $o->product_code,
//                     'name' => $o->product_name,
//                 ],
//                 'package' => [
//                     'code' => $o->package_code,
//                     'name' => $o->package_name,
//                 ],
//                 'duration' => [
//                     'code' => $o->duration_code,
//                     'name' => $o->duration_name,
//                 ],
//                 'intent'        => $o->intent,
//                 'base_order_id' => $o->base_order_id,
//             ];
//         });

//         return response()->json([
//             'success' => true,
//             'data' => [
//                 'items' => $items,
//                 'meta'  => [
//                     'current_page' => $orders->currentPage(),
//                     'per_page'     => $orders->perPage(),
//                     'total'        => $orders->total(),
//                     'last_page'    => $orders->lastPage(),
//                 ],
//             ],
//         ]);
//     }

//     public function myInvoices(Request $req)
//     {
//         /** @var \App\Models\Customer|null $auth */
//         $auth = auth('customer-api')->user();
//         if (!$auth) abort(401, 'Unauthorized');

//         // filter: ?status=paid|pending|failed|expired  (opsional)
//         $status = $req->query('status');

//         $q = Order::query()
//             ->where('customer_id', $auth->id)
//             // umumnya invoice ditampilkan utk order yg pernah dibuat (paid/pending/failed/expired)
//             ->when($status, fn($qq) => $qq->where('status', $status))
//             // ->orderByDesc('paid_at')
//             ->orderByDesc('created_at');

//         $perPage = (int) $req->query('per_page', 10);
//         $orders  = $q->paginate($perPage);

//         $items = collect($orders->items())->map(function (Order $o) {
//             $date = $o->paid_at ?: $o->created_at;

//             return [
//                 'order_id'          => (string) $o->id,
//                 'midtrans_order_id' => $o->midtrans_order_id,            // "INV-20250115-000123"
//                 'date'              => optional($date)->toDateString(),    // 2025-01-15
//                 'product_name'      => $o->product_name ?: $o->product_code,
//                 'package_name'      => $o->package_name ?: $o->package_code,
//                 'amount'            => (float) $o->total,
//                 'currency'          => $o->currency,
//                 'status'            => $o->status,                         // paid|pending|failed|expired
//                 'intent'            => $o->intent,
//                 'end_date'          => $o->end_date,
//                 // 'download_url'      => route('customer.invoice.download', ['id' => $o->id]),
//             ];
//         });

//         return response()->json([
//             'success' => true,
//             'data' => [
//                 'items' => $items,
//                 'meta'  => [
//                     'current_page' => $orders->currentPage(),
//                     'per_page'     => $orders->perPage(),
//                     'total'        => $orders->total(),
//                     'last_page'    => $orders->lastPage(),
//                 ],
//             ],
//         ]);
//     }

//     public function mySubscriptions(Request $req)
//     {
//         /** @var \App\Models\Customer|null $auth */
//         $auth = auth('customer-api')->user(); if (!$auth) abort(401);

//         $q = Subscription::where('customer_id', $auth->id)->orderBy('product_code');

//         if ((string)$req->query('active','') === '1') {
//             $q->currentlyActive();
//         }

//         $subs = $q->paginate((int)$req->query('per_page', 5));

//         $items = collect($subs->items())->map(function (Subscription $s) {
//             return [
//                 'subscription_id' => (string) $s->id,
//                 'product' => ['code' => $s->product_code,'name' => $s->product_name],
//                 'package' => ['code' => $s->current_package_code, 'name' => $s->current_package_name],
//                 'duration'=> ['code' => $s->duration_code, 'name' => $s->duration_name],
//                 'start_date' => optional($s->start_date)->toDateString(),
//                 'end_date'   => optional($s->end_date)->toDateString(),
//                 'is_active'  => (bool) $s->is_active,
//                 'is_currently_active'=> $s->is_currently_active,   // hasil hitung now()
//                 'status'     => $s->status,
//                 'meta'       => $s->meta,
//             ];
//         });

//         return response()->json([
//             'success' => true,
//             'data' => [
//                 'items' => $items,
//                 'meta'  => [
//                     'current_page' => $subs->currentPage(),
//                     'per_page'     => $subs->perPage(),
//                     'total'        => $subs->total(),
//                     'last_page'    => $subs->lastPage(),
//                 ],
//             ],
//         ]);
//     }
// }
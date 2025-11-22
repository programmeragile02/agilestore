<?php

namespace App\Http\Controllers;

use App\Mail\CustomerPasswordResetCodeMail;
use App\Models\Customer;
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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

    // private function createOrder(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period, string $intent)
    // {
    //     $data = $req->validate([
    //         'product_code'   => 'required|string|exists:mst_products,product_code',
    //         'package_code'   => 'required|string|exists:mst_product_packages,package_code',
    //         'duration_code'  => 'required|string|exists:mst_durations,code',
    //         'base_order_id'  => 'nullable|uuid|exists:orders,id',
    //     ]);

    //     $auth = auth('customer-api')->user(); if (!$auth) abort(401,'Unauthorized');

    //     $baseOrder = null;
    //     if (in_array($intent, ['renew','upgrade'])) {
    //         $baseOrder = Order::findOrFail($data['base_order_id']);
    //         if ((string)$baseOrder->customer_id !== (string)$auth->id) {
    //             throw ValidationException::withMessages(['base_order_id' => 'Order lama bukan milik Anda.']);
    //         }
    //         if ($baseOrder->status !== 'paid') {
    //             throw ValidationException::withMessages(['base_order_id' => 'Order lama tidak valid untuk '.$intent]);
    //         }
    //     }

    //     if ($intent === 'renew') {
    //         if ($baseOrder->product_code !== $data['product_code']) {
    //             throw ValidationException::withMessages(['product_code' => ['Product tidak sama dengan base_order_id.']]);
    //         }
    //         if ($baseOrder->package_code !== $data['package_code']) {
    //             throw ValidationException::withMessages(['package_code' => ['Renew tidak boleh ganti paket. Gunakan upgrade.']]);
    //         }
    //     }
    //     if ($intent === 'upgrade') {
    //         if ($baseOrder->product_code !== $data['product_code']) {
    //             throw ValidationException::withMessages(['product_code' => ['Product tidak sama dengan base_order_id.']]);
    //         }
    //     }

    //     $product = MstProduct::where('product_code',$data['product_code'])->first();
    //     if (!$product) throw ValidationException::withMessages(['product_code'=>'Produk tidak ditemukan.']);

    //     $package = MstProductPackage::where('package_code',$data['package_code'])
    //               ->where('product_code',$data['product_code'])->first();
    //     if (!$package) throw ValidationException::withMessages(['package_code'=>'Paket tidak sesuai produk.']);

    //     $duration = MstDuration::where('code',$data['duration_code'])->first();
    //     if (!$duration) throw ValidationException::withMessages(['duration_code'=>'Durasi tidak valid.']);

    //     $today = now()->toDateString();
    //     $lastActiveForProduct = Order::query()
    //         ->where('customer_id', $auth->id)
    //         ->where('product_code', $data['product_code'])
    //         ->where('status', 'paid')
    //         ->where('is_active', true)
    //         ->where(fn($q)=>$q->whereNull('end_date')->orWhereDate('end_date','>=',$today))
    //         ->orderByDesc('end_date')->first();

    //     if ($intent === 'purchase' && $lastActiveForProduct) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Anda sudah memiliki langganan aktif untuk produk ini.',
    //             'data' => [
    //                 'existing_order_id' => (string)$lastActiveForProduct->id,
    //                 'package_code' => $lastActiveForProduct->package_code,
    //                 'package_name' => $lastActiveForProduct->package_name,
    //                 'end_date' => optional($lastActiveForProduct->end_date)->toDateString(),
    //             ],
    //         ], 422);
    //     }

    //     ['start_date'=>$start,'end_date'=>$end] = $period->compute($intent,$baseOrder,$duration);

    //     $priceInfo = $pricing->resolvePrice($data['product_code'],$data['package_code'],$data['duration_code'],$intent,$baseOrder?->id);
    //     if (!isset($priceInfo['total'])) abort(422,'Tidak bisa menentukan harga.');

    //     $subscriptionInstanceId = $intent==='purchase'
    //         ? (string) Str::uuid()
    //         : (data_get($baseOrder,'meta.subscription_instance_id') ?: ($lastActiveForProduct?->meta['subscription_instance_id'] ?? null));

    //     $order = new Order();
    //     $order->fill([
    //         'customer_id'   => (string)$auth->id,
    //         'customer_name' => $auth->full_name,
    //         'customer_email'=> $auth->email,
    //         'customer_phone'=> $auth->phone,

    //         'product_code'  => $data['product_code'],
    //         'product_name'  => $product->product_name ?? $data['product_code'],
    //         'package_code'  => $data['package_code'],
    //         'package_name'  => $package->name ?? $data['package_code'],
    //         'duration_code' => $data['duration_code'],
    //         'duration_name' => $duration->name ?? $data['duration_code'],

    //         'pricelist_item_id'=> $priceInfo['pricelist_item_id'],
    //         'price'            => $priceInfo['price'],
    //         'discount'         => $priceInfo['discount'],
    //         'total'            => $priceInfo['total'],
    //         'currency'         => $priceInfo['currency'],

    //         'start_date'   => $start,
    //         'end_date'     => $end,
    //         'is_active'    => false,
    //         'status'       => 'pending',
    //         'intent'       => $intent,
    //         'base_order_id'=> $baseOrder?->id,
    //     ]);
    //     $order->save();

    //     $midtransOrderId = $this->nextMidtransOrderId($product->product_code);

    //     $frontend = rtrim(env('FRONTEND_URL','http://localhost:3000'),'/');
    //     $payload = [
    //         'transaction_details' => ['order_id'=>$midtransOrderId,'gross_amount'=>(int)round($order->total)],
    //         'customer_details'    => ['first_name'=>$order->customer_name,'email'=>$order->customer_email,'phone'=>$order->customer_phone],
    //         'item_details'        => [[
    //             'id'=>$order->package_code,'price'=>(int)round($order->total),'quantity'=>1,
    //             'name'=>"{$order->product_name} - {$order->package_name} ({$order->duration_name})",
    //         ]],
    //         'callbacks' => [
    //             'finish'=>"$frontend/orders/{$order->id}?status=success",
    //             'error' =>"$frontend/orders/{$order->id}?status=error",
    //         ],
    //     ];
    //     $snapToken = app(MidtransService::class)->createSnapToken($payload);

    //     $order->midtrans_order_id = $midtransOrderId;
    //     $order->snap_token        = $snapToken;
    //     $order->meta = array_merge($order->meta ?? [], [
    //         'subscription_instance_id' => $subscriptionInstanceId,
    //     ]);
    //     $order->save();

    //     return response()->json([
    //         'success'=>true,'message'=>'Order created','data'=>[
    //             'order_id'=>$order->id,'midtrans_order_id'=>$order->midtrans_order_id,'snap_token'=>$snapToken,
    //             'total'=>(float)$order->total,'currency'=>$order->currency,'status'=>$order->status,'intent'=>$order->intent,
    //             'base_order_id'=>$order->base_order_id,
    //             'start_date'=>optional($order->start_date)->toDateString(),'end_date'=>optional($order->end_date)->toDateString(),
    //             'product'=>['code'=>$order->product_code,'name'=>$order->product_name],
    //             'package'=>['code'=>$order->package_code,'name'=>$order->package_name],
    //             'duration'=>['code'=>$order->duration_code,'name'=>$order->duration_name],
    //         ]
    //     ],201);
    // }

    private function createOrder(Request $req, PricingService $pricing, MidtransService $midtrans, PeriodService $period, string $intent)
    {
        // Base validations
        $baseRules = [
            'product_code'   => 'required|string|exists:mst_products,product_code',
            'package_code'   => 'required|string|exists:mst_product_packages,package_code',
            'duration_code'  => 'required|string|exists:mst_durations,code',
            'base_order_id'  => 'nullable|uuid|exists:orders,id',
        ];

        $auth = auth('customer-api')->user();

        // Pastikan hanya purchase yang boleh tanpa login
        if (!$auth && $intent !== 'purchase') {
            abort(401, 'Unauthorized');
        }

        if (!$auth) {
            $contactRules = [
                'contact.fullName' => 'required|string|max:255',
                'contact.email'    => 'required|email|max:100',
                'contact.phone'    => 'nullable|string|max:30',
                'contact.company'  => 'nullable|string|max:100',
            ];
            $data = $req->validate(array_merge($baseRules, $contactRules));
        } else {
            $data = $req->validate($baseRules);
        }

        // baseOrder checks (renew/upgrade)
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

        // resolve product/package/duration
        $product = MstProduct::where('product_code',$data['product_code'])->first();
        if (!$product) throw ValidationException::withMessages(['product_code'=>'Produk tidak ditemukan.']);

        $package = MstProductPackage::where('package_code',$data['package_code'])
                ->where('product_code',$data['product_code'])->first();
        if (!$package) throw ValidationException::withMessages(['package_code'=>'Paket tidak sesuai produk.']);

        $duration = MstDuration::where('code',$data['duration_code'])->first();
        if (!$duration) throw ValidationException::withMessages(['duration_code'=>'Durasi tidak valid.']);

        // Start transaction
        DB::beginTransaction();
        try {
            $guestCustomer = null;
            $emailAlreadyExists = false;
            $accountCreated = false;
            $issuedAccessToken = null;
            $issuedTokenTTL = null;

            // If guest: attempt auto-create account if email not exists
            if (!$auth) {
                $contact = $data['contact'];
                $email = strtolower(trim($contact['email']));
                $phone = $contact['phone'] ?? null;
                $fullName = $contact['fullName'] ?? $email;

                $existing = Customer::where('email', $email)
                    ->orWhere(function($q) use ($phone) {
                        if ($phone) $q->where('phone', $phone);
                    })->first();

                if ($existing) {
                    $emailAlreadyExists = true;
                    $guestCustomer = null;
                } else {
                    // create customer with strong random password
                    $randomPassword = Str::random(40);
                    $guestCustomer = Customer::create([
                        'full_name' => $fullName,
                        'email'     => $email,
                        'phone'     => $phone,
                        'company'   => $contact['company'] ?? null,
                        'password'  => Hash::make($randomPassword),
                        'is_active' => true,
                    ]);
                    $accountCreated = true;

                    // Issue one-time/short-lived JWT so FE can auto-login
                    try {
                        auth()->shouldUse('customer-api');
                        // login returns token via tymon/jwt-auth
                        $issuedAccessToken = auth('customer-api')->login($guestCustomer);
                        // get TTL seconds (you may override config ttl if needed)
                        $issuedTokenTTL = auth('customer-api')->factory()->getTTL() * 60;
                    } catch (\Throwable $t) {
                        \Log::warning('Auto-login after create customer failed: '.$t->getMessage());
                        $issuedAccessToken = null;
                        $issuedTokenTTL = null;
                    }
                }
            } else {
                // authenticated user -> order will be linked to auth
                $guestCustomer = $auth;
            }

            // If customer id exists (auth or guestCustomer) check duplicate active product (prevent purchase)
            $today = now()->toDateString();
            $checkCustomerId = $auth ? $auth->id : ($guestCustomer ? $guestCustomer->id : null);
            $lastActiveForProduct = null;
            if ($checkCustomerId) {
                $lastActiveForProduct = Order::query()
                    ->where('customer_id', $checkCustomerId)
                    ->where('product_code', $data['product_code'])
                    ->where('status', 'paid')
                    ->where('is_active', true)
                    ->where(fn($q)=>$q->whereNull('end_date')->orWhereDate('end_date','>=',$today))
                    ->orderByDesc('end_date')->first();

                if ($intent === 'purchase' && $lastActiveForProduct) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda sudah memiliki langganan aktif untuk produk ini.',
                        'data' => [
                            'existing_order_id' => (string)$lastActiveForProduct->id,
                            'package_code' => $lastActiveForProduct->package_code,
                            'package_name' => $lastActiveForProduct->package_name,
                            'end_date' => optional($lastActiveForProduct->end_date)->toDateString(),
                        ],
                    ], 422);
                }
            }

            // compute period and price
            ['start_date'=>$start,'end_date'=>$end] = $period->compute($intent, $baseOrder, $duration);

            $priceInfo = $pricing->resolvePrice($data['product_code'],$data['package_code'],$data['duration_code'],$intent, $baseOrder?->id);
            if (!isset($priceInfo['total'])) {
                DB::rollBack();
                abort(422,'Tidak bisa menentukan harga.');
            }

            // === Inject addon ke invoice renewal ===
            $addonChargeLines = [];
            $addonChargeTotal = 0;
            $subscriptionInstanceId = null;

            if (in_array($intent, ['renew'])) {
                $subscriptionInstanceId =
                    data_get($baseOrder, 'meta.subscription_instance_id')
                    ?: ($lastActiveForProduct?->meta['subscription_instance_id'] ?? null);

                if ($subscriptionInstanceId) {
                    $billableAddons = \DB::table('subscription_addons')
                        ->where('subscription_instance_id', $subscriptionInstanceId)
                        ->where(function($q) use ($start) {
                            $q->whereNull('billable_from_start')
                            ->orWhere('billable_from_start','<=',$start->toDateString());
                        })
                        ->get(['feature_code','feature_name','price_amount'])
                        ->map(fn($r) => [
                            'feature_code' => (string)$r->feature_code,
                            'name'         => (string)($r->feature_name ?: $r->feature_code),
                            'amount'       => (int)($r->price_amount ?: 0),
                        ])->all();

                    foreach ($billableAddons as $al) {
                        if (($al['amount'] ?? 0) > 0) {
                            $addonChargeLines[] = $al;
                            $addonChargeTotal  += (int)$al['amount'];
                        }
                    }
                }
            }

            // total akhir = harga paket + total addon yg jatuh tempo
            $grandTotal = (float)$priceInfo['total'] + (float)$addonChargeTotal;

            $subscriptionInstanceId = $intent==='purchase'
                ? (string) Str::uuid()
                : (data_get($baseOrder,'meta.subscription_instance_id') ?: ($lastActiveForProduct?->meta['subscription_instance_id'] ?? null));

            // create order and link to guestCustomer if exists
            $order = new Order();
            $order->fill([
                'customer_id'   => $guestCustomer ? (string)$guestCustomer->id : null,
                'customer_name' => $guestCustomer ? $guestCustomer->full_name : ($data['contact']['fullName'] ?? ($auth->full_name ?? null)),
                'customer_email'=> $guestCustomer ? $guestCustomer->email : ($data['contact']['email'] ?? ($auth->email ?? null)),
                'customer_phone'=> $guestCustomer ? $guestCustomer->phone : ($data['contact']['phone'] ?? ($auth->phone ?? null)),

                'product_code'  => $data['product_code'],
                'product_name'  => $product->product_name ?? $data['product_code'],
                'package_code'  => $data['package_code'],
                'package_name'  => $package->name ?? $data['package_code'],
                'duration_code' => $data['duration_code'],
                'duration_name' => $duration->name ?? $data['duration_code'],

                'pricelist_item_id'=> $priceInfo['pricelist_item_id'],
                'price'            => $priceInfo['price'],
                'discount'         => $priceInfo['discount'],
                'total'            => $grandTotal,
                'currency'         => $priceInfo['currency'],

                'start_date'   => $start,
                'end_date'     => $end,
                'is_active'    => false,
                'status'       => 'pending',
                'intent'       => $intent,
                'base_order_id'=> $baseOrder?->id,
            ]);
            $order->meta = array_merge($order->meta ?? [], [
                'subscription_instance_id' => $subscriptionInstanceId
                    ?? data_get($order, 'meta.subscription_instance_id') ?? null,
                'renew_addons' => [ 'lines' => $addonChargeLines, 'total' => $addonChargeTotal ],
            ]);
            $order->save();

            // create midtrans payload + snap token (same as before)
            $midtransOrderId = $this->nextMidtransOrderId($product->product_code);
            $frontend = rtrim(env('FRONTEND_URL','http://localhost:3000'),'/');

            $itemDetails = [[
                'id'       => $order->package_code,
                'price'    => (int)round($priceInfo['total']),
                'quantity' => 1,
                'name'     => "{$order->product_name} - {$order->package_name} ({$order->duration_name})",
            ]];

            if (!empty($addonChargeLines)) {
                foreach ($addonChargeLines as $al) {
                    $itemDetails[] = [
                        'id'       => 'addon:'.$al['feature_code'],
                        'price'    => (int)$al['amount'],
                        'quantity' => 1,
                        'name'     => 'Add-on: '.$al['name'],
                    ];
                }
            }

            $payload = [
                'transaction_details' => [
                    'order_id'=>$midtransOrderId,
                    'gross_amount'=>(int)round($order->total)
                ],
                'customer_details'    => [
                    'first_name'=>$order->customer_name,
                    'email'=>$order->customer_email,
                    'phone'=>$order->customer_phone
                ],
                'item_details'        => $itemDetails,
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

            DB::commit();

            // Return response and include optional access_token if issued
            $resp = [
                'success'=>true,'message'=>'Order created','data'=>[
                    'order_id'=>$order->id,
                    'midtrans_order_id'=>$order->midtrans_order_id,
                    'snap_token'=>$snapToken,
                    'total'=>(float)$order->total,
                    'currency'=>$order->currency,
                    'status'=>$order->status,
                    'intent'=>$order->intent,
                    'base_order_id'=>$order->base_order_id,
                    'start_date'=>optional($order->start_date)->toDateString(),
                    'end_date'=>optional($order->end_date)->toDateString(),
                    'product'=>['code'=>$order->product_code,'name'=>$order->product_name],
                    'package'=>['code'=>$order->package_code,'name'=>$order->package_name],
                    'duration'=>['code'=>$order->duration_code,'name'=>$order->duration_name],
                    'account_created' => $accountCreated,
                    'email_already_exists' => $emailAlreadyExists,
                ]
            ];

            if ($issuedAccessToken) {
                $resp['data']['access_token'] = (string)$issuedAccessToken;
                $resp['data']['token_type'] = 'Bearer';
                $resp['data']['expires_in'] = $issuedTokenTTL;
            }

            return response()->json($resp, 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Checkout/createOrder error: '.$e->getMessage(), ['trace'=>$e->getTraceAsString()]);
            return response()->json(['success'=>false,'error'=>'Failed to create order'], 500);
        }
    }

    // ================== ADD-ON ==================

    public function addon(Request $req, AddonService $svc, MidtransService $midtrans)
    {
        $data = $req->validate([
            'product_code' => 'required|string|exists:mst_products,product_code',
            'features'     => 'sometimes|array',
            'features.*'   => 'string',
            'addons'       => 'sometimes|array',
            'addons.*.addon_code' => 'required_with:addons|string',
            'addons.*.qty'        => 'nullable|integer|min:1',
            'subscription_instance_id' => 'nullable|uuid',
        ]);

        $auth = auth('customer-api')->user(); if (!$auth) abort(401);

        // subscription aktif untuk ambil paket & durasi base
        $sub = Subscription::query()
            ->where('customer_id',$auth->id)
            ->where('product_code',$data['product_code'])
            ->where('is_active',true)
            ->orderByDesc('end_date')->orderByDesc('created_at')
            ->first();
        if (!$sub) {
            throw ValidationException::withMessages([
                'product_code'=>['Anda belum punya langganan aktif untuk produk ini.']
            ]);
        }

        $instanceId = $data['subscription_instance_id']
            ?? $this->resolveInstanceIdForCustomerProduct((string)$auth->id, $data['product_code']);
        if (!$instanceId) {
            throw ValidationException::withMessages([
                'subscription_instance_id'=>['Tidak bisa menemukan instance aktif untuk produk ini.']
            ]);
        }

        $wantedFeatures = array_values(array_unique($data['features'] ?? []));
        $wantedAddons   = $data['addons'] ?? [];

        if (empty($wantedFeatures) && empty($wantedAddons)) {
            throw ValidationException::withMessages([
                'features'=>['Harus memilih minimal satu fitur atau addon.']
            ]);
        }

        // ====== 1) Resolve fitur (hierarki lama) → linesFeatures
        $linesFeatures = [];
        $grantFeatures = [];
        if (!empty($wantedFeatures)) {
            $resFeat = $svc->resolvePayableHierarchical(
                productCode: $data['product_code'],
                packageCode: $sub->current_package_code,
                wanted:      $wantedFeatures,
                alreadyBoughtParentCodes: [] // bisa dedup bila perlu
            );

            // Jika semua sudah include/terbeli, resFeat['lines'] kosong
            $linesFeatures = $resFeat['lines'];
            $grantFeatures = $resFeat['grant_features'];
        }

        // ====== 2) Resolve master addon (qty) → linesAddons
        $linesAddons = [];
        if (!empty($wantedAddons)) {
            $resAdd = $svc->computeMasterAddons($data['product_code'], $wantedAddons);
            $linesAddons = $resAdd['lines'];
        }

        if (empty($linesFeatures) && empty($linesAddons)) {
            throw ValidationException::withMessages([
                'features'=>['Semua pilihan sudah termasuk paket/terbeli atau nilai tidak valid.']
            ]);
        }

        // ====== 3) Tentukan kapan ditagih (ikut siklus berikut base)
        $today = now()->startOfDay();
        $end   = $sub->end_date ? \Carbon\Carbon::parse($sub->end_date)->startOfDay() : $today;
        $nextPeriodStart = $end->copy()->addDay()->startOfDay();

        $dur = \App\Models\MstDuration::where('code', $sub->duration_code)->first();
        $billableFrom = $nextPeriodStart->copy();
        if ($dur) {
            $len = (int) $dur->length;
            $unit= strtolower((string)$dur->unit);
            if (in_array($unit, ['month','months'])) {
                $billableFrom = $billableFrom->addMonthsNoOverflow($len);
            } elseif (in_array($unit, ['day','days'])) {
                $billableFrom = $billableFrom->addDays($len);
            } else {
                $billableFrom = $billableFrom->addMonthsNoOverflow($len);
            }
        } else {
            $billableFrom = $billableFrom->addMonthsNoOverflow(1);
        }

        // ====== 4) Buat ORDER Rp0 → aktifkan sekarang (seperti sebelumnya)
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
            'duration_code'  => $sub->duration_code,
            'duration_name'  => $sub->duration_name,

            'price'          => 0,
            'discount'       => 0,
            'total'          => 0,
            'currency'       => 'IDR',

            'start_date'     => null,
            'end_date'       => null,
            'is_active'      => true,
            'status'         => 'paid',
            'paid_at'        => now(),
            'intent'         => 'addon',
        ]);

        // simpan meta gabungan
        $order->meta = array_merge($order->meta ?? [], [
            'subscription_instance_id' => $instanceId,
            'features'       => collect($linesFeatures)->pluck('feature_code')->values()->all(), // parent only
            'grant_features' => $grantFeatures,
            'lines'          => [
                'features' => $linesFeatures,
                'addons'   => $linesAddons,
            ],
            'addon_billing'    => [
                'billable_from_start'  => $billableFrom->toDateString(),
                'follow_base_duration' => true,
                'cycle_code'           => $sub->duration_code,
            ],
        ]);
        $order->midtrans_order_id = null;
        $order->snap_token        = null;
        $order->save();

        // provision ke warehouse sekali (paid)
        if (!$order->provision_notified_at) {
            dispatch(new \App\Jobs\NotifyWarehouseJob((string)$order->id))
                ->onQueue('provisioning');
        }

        // ====== 5) Simpan ke subscription_addons untuk ditagih saat renew
        // 5a. Fitur (parent lines)
        foreach ($linesFeatures as $p) {
            \DB::table('subscription_addons')->updateOrInsert(
                [
                    'subscription_instance_id' => $instanceId,
                    'feature_code'             => (string)$p['feature_code'],
                ],
                [
                    'feature_name'         => (string)$p['name'],
                    'price_amount'         => (int)$p['amount'],
                    'currency'             => 'IDR',
                    'order_id'             => (string)$order->id,
                    'midtrans_order_id'    => null,
                    'purchased_at'         => now(),
                    'billable_from_start'  => $billableFrom->toDateString(),
                    'follow_base_duration' => 1,
                    'cycle_code'           => $sub->duration_code,
                    'updated_at'           => now(),
                    'created_at'           => now(),
                ]
            );
        }

        // 5b. Master Addon (qty lines)
        foreach ($linesAddons as $row) {
            \DB::table('subscription_addons')->updateOrInsert(
                [
                    'subscription_instance_id' => $instanceId,
                    'addon_code'               => (string)$row['addon_code'],
                ],
                [
                    'feature_code'         => null, // bukan fitur
                    'feature_name'         => null,
                    'price_amount'         => (int)$row['amount'],
                    'currency'             => (string)($row['currency'] ?? 'IDR'),
                    'qty'                  => (int)($row['qty'] ?? 1),
                    'unit_price'           => (int)($row['unit_price'] ?? 0),
                    'pricing_mode'         => (string)($row['pricing_mode'] ?? 'per_unit'),
                    'kind'                 => (string)($row['kind'] ?? ''),
                    'order_id'             => (string)$order->id,
                    'midtrans_order_id'    => null,
                    'purchased_at'         => now(),
                    'billable_from_start'  => $billableFrom->toDateString(),
                    'follow_base_duration' => 1,
                    'cycle_code'           => $sub->duration_code,
                    'updated_at'           => now(),
                    'created_at'           => now(),
                ]
            );
        }

        return response()->json(['success'=>true,'data'=>[
            'order_id'=>(string)$order->id,
            'snap_token'=>null,
            'total'=>0,
            'billable_from_start'=>$billableFrom->toDateString(),
        ]], 201);
    }

    // public function addon(Request $req, AddonService $svc, MidtransService $midtrans)
    // {
    //     $data = $req->validate([
    //         'product_code' => 'required|string|exists:mst_products,product_code',
    //         'features'     => 'required|array|min:1',
    //         'features.*'   => 'string',
    //         'subscription_instance_id' => 'nullable|uuid',
    //     ]);

    //     $auth = auth('customer-api')->user(); if (!$auth) abort(401);

    //     // ambil subscription aktif (punya durasi & end_date)
    //     $sub = Subscription::query()
    //         ->where('customer_id',$auth->id)
    //         ->where('product_code',$data['product_code'])
    //         ->where('is_active',true)
    //         ->orderByDesc('end_date')->orderByDesc('created_at')
    //         ->first();

    //     if (!$sub) {
    //         throw ValidationException::withMessages([
    //             'product_code'=>['Anda belum punya langganan aktif untuk produk ini.']
    //         ]);
    //     }

    //     $instanceId = $data['subscription_instance_id']
    //         ?? $this->resolveInstanceIdForCustomerProduct((string)$auth->id, $data['product_code']);

    //     if (!$instanceId) {
    //         throw ValidationException::withMessages([
    //             'subscription_instance_id'=>['Tidak bisa menemukan instance aktif untuk produk ini.']
    //         ]);
    //     }

    //     // Resolve hierarki & total parent berbayar (tetap dipakai untuk grant)
    //     $res = $svc->resolvePayableHierarchical(
    //         productCode: $data['product_code'],
    //         packageCode: $sub->current_package_code,
    //         wanted:      $data['features'],
    //         alreadyBoughtParentCodes: [] // bisa tambahkan dedup beli ulang jika perlu
    //     );

    //     if (empty($res['lines'])) {
    //         throw ValidationException::withMessages([
    //             'features'=>['Semua pilihan sudah termasuk paket atau sudah Anda beli.']
    //         ]);
    //     }

    //     // === NEW: hitung billable_from_start (skip 1 siklus)
    //     $today = now()->startOfDay();
    //     $end   = $sub->end_date ? \Carbon\Carbon::parse($sub->end_date)->startOfDay() : $today;
    //     $nextPeriodStart = $end->copy()->addDay()->startOfDay();

    //     $dur = \App\Models\MstDuration::where('code', $sub->duration_code)->first();
    //     $billableFrom = $nextPeriodStart->copy();
    //     if ($dur) {
    //         $len = (int) $dur->length;
    //         $unit= strtolower((string)$dur->unit);
    //         if (in_array($unit, ['month','months'])) {
    //             $billableFrom = $billableFrom->addMonthsNoOverflow($len);
    //         } elseif (in_array($unit, ['day','days'])) {
    //             $billableFrom = $billableFrom->addDays($len);
    //         } else {
    //             $billableFrom = $billableFrom->addMonthsNoOverflow($len);
    //         }
    //     } else {
    //         $billableFrom = $billableFrom->addMonthsNoOverflow(1);
    //     }

    //     // === NEW: buat ORDER aktivasi add-on Rp0 → langsung paid & aktif
    //     $order = new Order();
    //     $order->fill([
    //         'customer_id'    => (string)$auth->id,
    //         'customer_name'  => $auth->full_name,
    //         'customer_email' => $auth->email,
    //         'customer_phone' => $auth->phone,

    //         'product_code'   => $sub->product_code,
    //         'product_name'   => $sub->product_name,
    //         'package_code'   => $sub->current_package_code,
    //         'package_name'   => $sub->current_package_name,

    //         'duration_code'  => $sub->duration_code,
    //         'duration_name'  => $sub->duration_name,

    //         'price'          => 0,
    //         'discount'       => 0,
    //         'total'          => 0,
    //         'currency'       => 'IDR',

    //         'start_date'     => null,
    //         'end_date'       => null,
    //         'is_active'      => true,        // aktif sekarang
    //         'status'         => 'paid',      // langsung paid
    //         'paid_at'        => now(),
    //         'intent'         => 'addon',
    //     ]);
    //     $order->meta = array_merge($order->meta ?? [], [
    //         'subscription_instance_id' => $instanceId,
    //         'features'         => $res['payable_parents'],
    //         'grant_features'   => $res['grant_features'],
    //         'lines'            => $res['lines'],
    //         'addon_billing'    => [ // untuk transparansi FE/BE
    //             'billable_from_start'  => $billableFrom->toDateString(),
    //             'follow_base_duration' => true,
    //             'cycle_code'           => $sub->duration_code,
    //         ],
    //     ]);
    //     $order->midtrans_order_id = null; // tidak pakai Midtrans utk Rp0
    //     $order->snap_token        = null;
    //     $order->save();

    //     // Langsung notify warehouse (karena status 'paid')
    //     if (!$order->provision_notified_at) {
    //         dispatch(new \App\Jobs\NotifyWarehouseJob((string)$order->id))
    //             ->onQueue('provisioning');
    //     }

    //     // Simpan daftar parent berbayar ke Store (untuk logika billing saat renew)
    //     foreach ($res['lines'] as $p) {
    //         \DB::table('subscription_addons')->updateOrInsert(
    //             [
    //                 'subscription_instance_id' => $instanceId,
    //                 'feature_code'             => (string)$p['feature_code'],
    //             ],
    //             [
    //                 'feature_name'         => (string)$p['name'],
    //                 'price_amount'         => (int)$p['amount'],
    //                 'currency'             => 'IDR',
    //                 'order_id'             => (string)$order->id,
    //                 'midtrans_order_id'    => null,
    //                 'purchased_at'         => now(),
    //                 'billable_from_start'  => $billableFrom->toDateString(),
    //                 'follow_base_duration' => 1,
    //                 'cycle_code'           => $sub->duration_code,
    //                 'updated_at'           => now(),
    //                 'created_at'           => now(),
    //             ]
    //         );
    //     }

    //     return response()->json(['success'=>true,'data'=>[
    //         'order_id'=>(string)$order->id,
    //         'snap_token'=>null,
    //         'total'=>0,
    //         'billable_from_start'=>$billableFrom->toDateString(),
    //     ]], 201);
    // }

    // {
    //     $data = $req->validate([
    //         'product_code' => 'required|string|exists:mst_products,product_code',
    //         'features'     => 'required|array|min:1',
    //         'features.*'   => 'string',
    //         'subscription_instance_id' => 'nullable|uuid',
    //     ]);

    //     $auth = auth('customer-api')->user(); if (!$auth) abort(401);

    //     // cek subscription aktif utk ambil paket
    //     $sub = Subscription::query()
    //         ->where('customer_id',$auth->id)
    //         ->where('product_code',$data['product_code'])
    //         ->where('is_active',true)
    //         ->orderByDesc('end_date')->orderByDesc('created_at')
    //         ->first();
    //     if (!$sub) throw ValidationException::withMessages([
    //         'product_code'=>['Anda belum punya langganan aktif untuk produk ini.']
    //     ]);

    //     $instanceId = $data['subscription_instance_id']
    //         ?? $this->resolveInstanceIdForCustomerProduct((string)$auth->id, $data['product_code']);
    //     if (!$instanceId) throw ValidationException::withMessages([
    //         'subscription_instance_id'=>['Tidak bisa menemukan instance aktif untuk produk ini.']
    //     ]);

    //     // Ambil PARENT yang sudah dibeli sebelumnya (pakai meta.features = parent codes)
    //     $boughtParents = Order::query()
    //         ->where('customer_id',$auth->id)
    //         ->where('product_code',$data['product_code'])
    //         ->where('intent','addon')->where('status','paid')
    //         ->where('meta->subscription_instance_id',$instanceId)
    //         ->get(['meta'])
    //         ->flatMap(function (Order $o) {
    //             $m = $o->meta;
    //             if (is_string($m)) $m = json_decode($m, true) ?: [];
    //             $arr = data_get($m, 'features', []);
    //             return is_array($arr) ? $arr : [];
    //         })
    //         ->unique()->values()->all();

    //     // Resolve hierarki
    //     $res = $svc->resolvePayableHierarchical(
    //         productCode: $data['product_code'],
    //         packageCode: $sub->current_package_code,
    //         wanted:      $data['features'],
    //         alreadyBoughtParentCodes: $boughtParents
    //     );

    //     if (empty($res['lines'])) {
    //         throw ValidationException::withMessages([
    //             'features'=>['Semua pilihan sudah termasuk paket atau sudah Anda beli.']
    //         ]);
    //     }

    //     // Buat order
    //     $order = new Order();
    //     $order->fill([
    //         'customer_id'    => (string)$auth->id,
    //         'customer_name'  => $auth->full_name,
    //         'customer_email' => $auth->email,
    //         'customer_phone' => $auth->phone,

    //         'product_code'   => $sub->product_code,
    //         'product_name'   => $sub->product_name,
    //         'package_code'   => $sub->current_package_code,
    //         'package_name'   => $sub->current_package_name,

    //         'duration_code'  => null, 'duration_name'=> null,
    //         'price'          => $res['total'],
    //         'discount'       => 0,
    //         'total'          => $res['total'],
    //         'currency'       => 'IDR',

    //         'start_date'     => null,
    //         'end_date'       => null,
    //         'is_active'      => false,
    //         'status'         => 'pending',
    //         'intent'         => 'addon',
    //     ]);
    //     $order->meta = array_merge($order->meta ?? [], [
    //         'subscription_instance_id' => $instanceId,
    //         'features'         => $res['payable_parents'], // SIMPAN parent yg dibeli
    //         'grant_features'   => $res['grant_features'],  // parent+children (untuk warehouse)
    //         'lines'            => $res['lines'],           // untuk kurasi Midtrans
    //     ]);
    //     $order->save();

    //     // Midtrans
    //     $midId = $this->nextMidtransOrderId($sub->product_code);
    //     $payload = [
    //         'transaction_details' => ['order_id'=>$midId,'gross_amount'=>(int)$order->total],
    //         'customer_details'    => ['first_name'=>$order->customer_name,'email'=>$order->customer_email,'phone'=>$order->customer_phone],
    //         'item_details'        => $svc->midtransItems($res['lines']),  // HANYA parent
    //         'callbacks'           => [
    //             'finish'=>rtrim(env('FRONTEND_URL','http://localhost:3000'),'/')."/orders/{$order->id}?intent=addon&status=success",
    //             'error' =>rtrim(env('FRONTEND_URL','http://localhost:3000'),'/')."/orders/{$order->id}?intent=addon&status=error",
    //         ],
    //     ];

    //     \Log::info('ADDON ORDER', [
    //         'order_id' => (string)$order->id,
    //         'parents'  => $res['payable_parents'],
    //         'grant'    => $res['grant_features'],
    //         'total'    => $res['total'],
    //     ]);
    //     $snap = $midtrans->createSnapToken($payload);
    //     $order->midtrans_order_id = $midId;
    //     $order->snap_token        = $snap;
    //     $order->save();

    //     return response()->json(['success'=>true,'data'=>[
    //         'order_id'=>(string)$order->id,
    //         'snap_token'=>$snap,
    //         'total'=>(int)$order->total
    //     ]], 201);
    // }

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

    // check produk
    public function checkProduct(Request $req)
    {
        $data = $req->validate([
            'product_code' => 'required|string|exists:mst_products,product_code',
            'email'        => 'nullable|email',
        ]);

        $auth = auth('customer-api')->user();

        if (!$auth) {
            if (empty($data['email'])) {
                // untuk publik, require param email supaya tidak bocor data
                abort(401, 'Unauthorized: please login or provide email to check');
            }
            $customer = Customer::where('email', strtolower(trim($data['email'])))->first();
            if (!$customer) {
                // tidak ada akun -> pasti tidak aktif
                return response()->json(['success'=>true,'data'=>[
                    'has_active' => false,
                    'existing_order_id' => null,
                    'package_code' => null,
                    'package_name' => null,
                    'end_date' => null,
                ]]);
            }
            $customerId = $customer->id;
        } else {
            $customerId = $auth->id;
        }

        $today = now()->toDateString();
        $last = Order::query()
            ->where('customer_id', (string)$customerId)
            ->where('product_code', $data['product_code'])
            ->where('status', 'paid')
            ->where('is_active', true)
            ->where(fn($q) => $q->whereNull('end_date')->orWhereDate('end_date','>=',$today))
            ->orderByDesc('end_date')
            ->first();

        return response()->json(['success'=>true,'data'=>[
            'has_active' => (bool)$last,
            'existing_order_id' => $last ? (string)$last->id : null,
            'package_code' => $last ? $last->package_code : null,
            'package_name' => $last ? $last->package_name : null,
            'end_date' => $last ? optional($last->end_date)->toDateString() : null,
        ]]);
    }

    // ============= RENEW PREVIEW (public) =============
    public function renewPreview(Request $req, PricingService $pricing, PeriodService $period)
    {
        $auth = auth('customer-api')->user(); if (!$auth) abort(401, 'Unauthorized');

        $data = $req->validate([
            'product_code'  => 'required|string|exists:mst_products,product_code',
            'package_code'  => 'required|string|exists:mst_product_packages,package_code',
            'duration_code' => 'required|string|exists:mst_durations,code',
            'base_order_id' => 'nullable|uuid|exists:orders,id',
        ]);

        $calc = $this->buildRenewPreviewPayload($auth->id, $data, $pricing, $period);

        return response()->json(['success'=>true, 'data'=>$calc]);
    }

    // ============= Helper kalkulasi yang dipakai preview & createOrder =============
    private function buildRenewPreviewPayload(
        string $customerId,
        array $data,
        PricingService $pricing,
        PeriodService $period
    ): array {
        // Validasi & resolve entity
        $product  = MstProduct::where('product_code',$data['product_code'])->firstOrFail();
        $package  = MstProductPackage::where('package_code',$data['package_code'])
                    ->where('product_code',$data['product_code'])->firstOrFail();
        $duration = MstDuration::where('code',$data['duration_code'])->firstOrFail();

        $baseOrder = null;
        if (!empty($data['base_order_id'])) {
            $baseOrder = Order::findOrFail($data['base_order_id']);
            if ((string)$baseOrder->customer_id !== (string)$customerId) {
                throw ValidationException::withMessages(['base_order_id' => 'Order lama bukan milik Anda.']);
            }
            if ($baseOrder->status !== 'paid') {
                throw ValidationException::withMessages(['base_order_id' => 'Order lama tidak valid untuk renew.']);
            }
            // safety: product & paket harus sama untuk renew
            if ($baseOrder->product_code !== $data['product_code']) {
                throw ValidationException::withMessages(['product_code' => 'Product tidak sama dengan base_order_id.']);
            }
            if ($baseOrder->package_code !== $data['package_code']) {
                throw ValidationException::withMessages(['package_code' => 'Renew tidak boleh ganti paket. Gunakan upgrade.']);
            }
        }

        // Hitung periode & base price (pakai service yang sudah ada)
        ['start_date'=>$start,'end_date'=>$end] = $period->compute('renew', $baseOrder, $duration);

        $priceInfo = $pricing->resolvePrice(
            $data['product_code'],
            $data['package_code'],
            $data['duration_code'],
            'renew',
            $baseOrder?->id
        );

        // ===== Ambil ADD-ON yang ikut ditagih di renewal ini =====
        $instanceId =
            data_get($baseOrder,'meta.subscription_instance_id')
            ?? $this->resolveInstanceIdForCustomerProduct($customerId, $data['product_code']);

        $addonLines  = [];
        $addonsTotal = 0;

        if ($instanceId) {
            // Siapkan map nama master add-on utk lookup
            $addonMap = \DB::table('mst_addons')
                ->where('product_code', $data['product_code'])
                ->where(function($q){ $q->whereNull('status')->orWhere('status','active'); })
                ->pluck('name', 'addon_code')
                ->all();

            // Ambil pending add-ons yang sudah jatuh tempo ditagih di awal periode baru
            $pending = \DB::table('subscription_addons')
                ->where('subscription_instance_id', $instanceId)
                ->where(function($q) use ($start) {
                    $q->whereNull('billable_from_start')
                    ->orWhere('billable_from_start','<=', optional($start)->toDateString());
                })
                ->get([
                    'feature_code', 'feature_name',
                    'addon_code',
                    'price_amount', 'currency',
                    'qty', 'unit_price', 'pricing_mode', 'kind',
                ]);

            foreach ($pending as $row) {
                $isMaster = !empty($row->addon_code);
                $code     = $isMaster ? (string)$row->addon_code : (string)$row->feature_code;

                if ($code === '') { continue; }

                // Nama:
                $name = $isMaster
                    ? ($addonMap[$row->addon_code] ?? $row->feature_name ?? $row->addon_code)
                    : ($row->feature_name ?: $row->feature_code);

                // Hitung amount:
                $qty   = (int)($row->qty ?? 1);
                $unit  = (int)($row->unit_price ?? 0);
                $mode  = strtolower((string)($row->pricing_mode ?? 'flat'));
                $amt   = (int)($row->price_amount ?? 0);

                if ($amt <= 0) {
                    // Fallback common:
                    if (in_array($mode, ['per_unit','per_unit_per_cycle'], true)) {
                        $amt = $unit * max(1, $qty);
                    } else {
                        $amt = $unit; // 'flat' atau kosong
                    }
                }
                if ($amt <= 0) { continue; }

                $addonLines[] = [
                    // format baru yang seragam
                    'code'   => $code,
                    'kind'   => $isMaster ? 'master' : 'feature',
                    'name'   => (string)$name,
                    'amount' => (int)$amt,

                    // kompatibilitas FE lama (optional)
                    'feature_code' => $code,
                    // info tambahan (optional)
                    'qty'          => (int)($row->qty ?? 1),
                    'unit_price'   => (int)($row->unit_price ?? 0),
                    'pricing_mode' => (string)($row->pricing_mode ?? 'flat'),
                    'currency'     => (string)($row->currency ?? 'IDR'),
                ];

                $addonsTotal += (int)$amt;
            }
        }

        $baseOriginal = (float)($priceInfo['price'] ?? 0);
        $baseDiscount = (float)($priceInfo['discount'] ?? 0);
        $baseFinal    = (float)($priceInfo['total'] ?? max(0, $baseOriginal - $baseDiscount));

        $grandTotal = $baseFinal + $addonsTotal;

        return [
            'currency' => $priceInfo['currency'] ?? ($product->currency ?? 'IDR'),
            'period'   => [
                'start_date' => optional($start)->toDateString(),
                'end_date'   => optional($end)->toDateString(),
            ],
            'include_addons_now' => $addonsTotal > 0,
            'base' => [
                'original'        => (int)round($baseOriginal),
                'discount_amount' => (int)round($baseDiscount),
                'final'           => (int)round($baseFinal),
                'pricelist_item_id' => $priceInfo['pricelist_item_id'] ?? null,
            ],
            'addons' => [
                'lines' => $addonLines,
                'total' => (int)$addonsTotal,
            ],
            'total_payable' => (int)round($grandTotal),
            // info tambahan utk FE (optional)
            'product'  => ['code'=>$product->product_code, 'name'=>$product->product_name],
            'package'  => ['code'=>$package->package_code,   'name'=>$package->name],
            'duration' => ['code'=>$duration->code,          'name'=>$duration->name],
        ];
    }
}
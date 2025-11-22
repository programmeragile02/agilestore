<?php

namespace App\Http\Controllers;

use App\Models\MstPackageMatrix;
use App\Models\MstProduct;
use App\Models\MstProductAddon;
use App\Models\MstProductFeatures;
use App\Models\MstProductPackage;
use App\Models\MstDuration;
use App\Models\MstProductPricelist;
use App\Services\AddonService;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /**
     * GET /api/store/products
     * List produk aktif (ringkas).
     * Opsional: ?q=keyword
     */
    public function products(Request $request)
    {
        $q = (string) $request->query('q', '');

        $rows = MstProduct::query()
            ->active()
            ->when($q !== '', function ($w) use ($q) {
                $w->where(function ($s) use ($q) {
                    $s->where('product_code', 'like', "%{$q}%")
                      ->orWhere('product_name', 'like', "%{$q}%")
                      ->orWhere('category', 'like', "%{$q}%");
                });
            })
            ->withCount(['packages', 'features']) // boleh, karena relasi features() sudah ada di model
            ->orderBy('product_name')
            ->get([
                'product_code',
                'product_name',
                'category',
                'status',
                'description',
                'total_features',
                'upstream_updated_at',
            ]);

        return response()->json([
            'success' => true,
            'data'    => $rows,
        ]);
    }

    /**
     * GET /api/store/products/{product_code}
     * Detail produk + paket aktif + durasi aktif.
     * (Tanpa fitur per paket, sesuai revisi)
     */
    public function show(string $productCode)
    {
        // 1) Produk aktif
        $product = MstProduct::query()
            ->active()
            ->where('product_code', $productCode)
            ->firstOrFail([
                'product_code',
                'product_name',
                'category',
                'status',
                'description',
                'total_features',
                'upstream_updated_at',
            ]);

        // 2) Paket aktif milik produk (urut order_number)
        $packages = MstProductPackage::query()
            ->where('product_code', $productCode)
            ->where('status', 'active')
            ->with('pricelist')
            ->orderBy('order_number')
            ->get([
                'package_code',
                'name',
                'description',
                'status',
                'order_number',
            ]);

        // 3) Durasi aktif (urut length)
        $durations = MstDuration::query()
            ->where('status', 'active')
            ->orderBy('length')
            ->get([
                'id',
                'code',
                'name',
                'length',
                'unit',
                'is_default',
            ]);
        
        $pricelists = MstProductPricelist::query()
            ->where('product_code', $productCode)
            ->where('deleted_at', null)
            ->get()
            ;

        // 4) matrik paket fitur
        $matrixPackage = MstPackageMatrix::query()
            ->where('product_code', $productCode)
            ->where('item_type', 'feature')
            ->get();
        
        $features = MstProductFeatures::query()
            ->where('product_code', $productCode)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'product'   => $product,
                'packages'  => $packages,
                'durations' => $durations,
                'pricelists' => $pricelists,
                'package_matrix' => $matrixPackage,
                'features' => $features
            ],
        ]);
    }

    /**
     * GET /api/catalog/addons?product_code=...&package_code=...
     * - Mengembalikan daftar fitur add-on untuk suatu product.
     * - Jika package_code dikirim, tandai `included=true` untuk fitur yang sudah termasuk paket tsb.
     */

    public function addons(Request $req)
    {
        $data = $req->validate([
            'product_code' => 'required|string|exists:mst_products,product_code',
            'package_code' => 'nullable|string|exists:mst_product_packages,package_code',
            'subscription_instance_id' => 'nullable|uuid',
        ]);

        $productCode = $data['product_code'];
        $packageCode = $data['package_code'] ?? null;
        $instanceId  = $data['subscription_instance_id'] ?? null;

        // ================== 1) FITUR (seperti sebelumnya) ==================
        $features = \DB::table('mst_product_features')
            ->where('product_code', $productCode)
            ->where('is_active', 1)
            ->get(['feature_code','name','price_addon','menu_parent_code']);

        $includedSet = [];
        if ($packageCode) {
            $included = \DB::table('mst_package_matrix as m')
                ->join('mst_product_packages as p','p.id','=','m.package_id')
                ->where('m.product_code',$productCode)
                ->where('m.item_type','feature')->where('m.enabled',1)
                ->where('p.package_code',$packageCode)
                ->pluck('m.item_id')->all();
            $includedSet = array_flip($included);
        }

        $purchasedSet = [];
        if ($instanceId) {
            $purchasedParents = \App\Models\Order::query()
                ->where('product_code', $productCode)
                ->where('intent', 'addon')
                ->where('status', 'paid')
                ->where('meta->subscription_instance_id', $instanceId)
                ->get(['meta'])
                ->flatMap(function ($o) {
                    $m = $o->meta;
                    if (is_string($m)) $m = json_decode($m, true) ?: [];
                    $arr = data_get($m, 'features', []); // parent codes
                    return is_array($arr) ? $arr : [];
                })
                ->unique()->values()->all();
            $purchasedSet = array_flip($purchasedParents);
        }

        $byParent = [];
        foreach ($features as $f) {
            $p = $f->menu_parent_code ?: null;
            if ($p) {
                $byParent[$p] = $byParent[$p] ?? [];
                $byParent[$p][] = [
                    'feature_code' => (string)$f->feature_code,
                    'name'         => (string)$f->name,
                ];
            }
        }

        $featureItems = [];
        foreach ($features as $f) {
            $isParent = empty($f->menu_parent_code);
            if (!$isParent) continue;
            $code = (string)$f->feature_code;
            $featureItems[] = [
                'type'             => 'FEATURE',
                'feature_code'     => $code,
                'name'             => (string)$f->name,
                'menu_parent_code' => null,
                'price_addon'      => (int)round($f->price_addon ?? 0),
                'included'         => isset($includedSet[$code]),
                'purchased'        => isset($purchasedSet[$code]),
                'children'         => array_values($byParent[$code] ?? []),
            ];
        }

        // ================== 2) MASTER ADDON (baru) ==================
        $rawAddons = MstProductAddon::query()
            ->where('product_code', $productCode)
            ->where(function($q){
                $q->whereNull('status')->orWhere('status','active');
            })
            ->orderBy('order_number')
            ->get([
                'addon_code','name','description',
                'kind','pricing_mode',
                'unit_label','min_qty','step_qty','max_qty',
                'currency','unit_price',
            ]);

        // Jika instanceId ada, kita cek apakah pernah dibeli (opsional: tandai purchased)
        $purchasedAddons = [];
        if ($instanceId) {
            $purchasedAddons = \DB::table('subscription_addons')
                ->where('subscription_instance_id', $instanceId)
                ->whereNotNull('addon_code')
                ->pluck('addon_code')->unique()->all();
            $purchasedAddons = array_flip($purchasedAddons);
        }

        $masterItems = $rawAddons->map(function($a) use ($purchasedAddons) {
            return [
                'type'         => 'MASTER_ADDON',
                'addon_code'   => (string)$a->addon_code,
                'name'         => (string)$a->name,
                'description'  => (string)($a->description ?? ''),
                'kind'         => (string)($a->kind ?? ''),
                'pricing_mode' => (string)($a->pricing_mode ?? 'per_unit'),
                'unit_label'   => (string)($a->unit_label ?? ''),
                'min_qty'      => (int)($a->min_qty ?? 1),
                'step_qty'     => (int)($a->step_qty ?? 1),
                'max_qty'      => (int)($a->max_qty ?? 0), // 0=unlimited
                'currency'     => (string)($a->currency ?? 'IDR'),
                'unit_price'   => (int)($a->unit_price ?? 0),
                'purchased'    => isset($purchasedAddons[$a->addon_code]),
            ];
        })->values()->all();

        // ================== Gabungkan & kirim ==================
        $items = array_merge($featureItems, $masterItems);

        return response()->json([
            'success' => true,
            'data' => [
                'product_code' => $productCode,
                'package_code' => $packageCode,
                'currency'     => 'IDR',
                'items'        => $items,
            ],
        ]);
    }

    // public function addons(Request $req)
    // {
    //     $data = $req->validate([
    //         'product_code' => 'required|string|exists:mst_products,product_code',
    //         'package_code' => 'nullable|string|exists:mst_product_packages,package_code',
    //         'subscription_instance_id' => 'nullable|uuid',
    //     ]);

    //     $productCode = $data['product_code'];
    //     $packageCode = $data['package_code'] ?? null;
    //     $instanceId  = $data['subscription_instance_id'] ?? null;

    //     // 1) Semua fitur aktif
    //     $features = \DB::table('mst_product_features')
    //         ->where('product_code', $productCode)
    //         ->where('is_active', 1)
    //         ->get(['feature_code','name','price_addon','menu_parent_code']);

    //     // 2) Included dari paket
    //     $includedSet = [];
    //     if ($packageCode) {
    //         $included = \DB::table('mst_package_matrix as m')
    //             ->join('mst_product_packages as p','p.id','=','m.package_id')
    //             ->where('m.product_code',$productCode)
    //             ->where('m.item_type','feature')->where('m.enabled',1)
    //             ->where('p.package_code',$packageCode)
    //             ->pluck('m.item_id')->all();
    //         $includedSet = array_flip($included);
    //     }

    //     // 3) Parents yang SUDAH DIBELI oleh instance ini (intent=addon, paid)
    //     $purchasedSet = [];
    //     if ($instanceId) {
    //         $purchasedParents = \App\Models\Order::query()
    //             ->where('product_code', $productCode)
    //             ->where('intent', 'addon')
    //             ->where('status', 'paid')
    //             ->where('meta->subscription_instance_id', $instanceId)
    //             ->get(['meta'])
    //             ->flatMap(function ($o) {
    //                 $m = $o->meta;
    //                 if (is_string($m)) $m = json_decode($m, true) ?: [];
    //                 $arr = data_get($m, 'features', []); // parent codes
    //                 return is_array($arr) ? $arr : [];
    //             })
    //             ->unique()->values()->all();
    //         $purchasedSet = array_flip($purchasedParents);
    //     }

    //     // 4) Susun tree: parent dengan anak2 (seperti respon yang sudah kamu tunjukkan)
    //     $byParent = [];
    //     foreach ($features as $f) {
    //         $p = $f->menu_parent_code ?: null;
    //         if ($p) {
    //             $byParent[$p] = $byParent[$p] ?? [];
    //             $byParent[$p][] = [
    //                 'feature_code' => (string)$f->feature_code,
    //                 'name'         => (string)$f->name,
    //             ];
    //         }
    //     }

    //     $items = [];
    //     foreach ($features as $f) {
    //         $isParent = empty($f->menu_parent_code);
    //         if (!$isParent) continue; // kirim hanya parent
    //         $code = (string)$f->feature_code;
    //         $items[] = [
    //             'feature_code'     => $code,
    //             'name'             => (string)$f->name,
    //             'menu_parent_code' => null,
    //             'price_addon'      => (int)round($f->price_addon ?? 0),
    //             'included'         => isset($includedSet[$code]),
    //             'purchased'        => isset($purchasedSet[$code]),
    //             'children'         => array_values($byParent[$code] ?? []),
    //         ];
    //     }

    //     return response()->json([
    //         'success' => true,
    //         'data' => [
    //             'product_code' => $productCode,
    //             'package_code' => $packageCode,
    //             'currency'     => 'IDR',
    //             'items'        => $items,
    //         ],
    //     ]);
    // }
}

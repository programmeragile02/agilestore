<?php

namespace App\Http\Controllers;

use App\Models\MstPackageMatrix;
use App\Models\MstProduct;
use App\Models\MstProductFeatures;
use App\Models\MstProductPackage;
use App\Models\MstDuration;
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

        // 1) Semua fitur aktif
        $features = \DB::table('mst_product_features')
            ->where('product_code', $productCode)
            ->where('is_active', 1)
            ->get(['feature_code','name','price_addon','menu_parent_code']);

        // 2) Included dari paket
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

        // 3) Parents yang SUDAH DIBELI oleh instance ini (intent=addon, paid)
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

        // 4) Susun tree: parent dengan anak2 (seperti respon yang sudah kamu tunjukkan)
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

        $items = [];
        foreach ($features as $f) {
            $isParent = empty($f->menu_parent_code);
            if (!$isParent) continue; // kirim hanya parent
            $code = (string)$f->feature_code;
            $items[] = [
                'feature_code'     => $code,
                'name'             => (string)$f->name,
                'menu_parent_code' => null,
                'price_addon'      => (int)round($f->price_addon ?? 0),
                'included'         => isset($includedSet[$code]),
                'purchased'        => isset($purchasedSet[$code]),
                'children'         => array_values($byParent[$code] ?? []),
            ];
        }

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
}

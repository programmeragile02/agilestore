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
        ]);

        $productCode = $data['product_code'];
        $packageCode = $data['package_code'] ?? null;

        // 1) Ambil fitur aktif untuk product
        $features = MstProductFeatures::query()
            ->where('product_code', $productCode)
            ->where('is_active', 1)
            ->get(['feature_code','name','price_addon']);

        // 2) Set included jika ada package_code
        $includedSet = [];
        if ($packageCode) {
            $included = \DB::table('mst_package_matrix as m')
                ->join('mst_product_packages as p', 'p.id', '=', 'm.package_id')
                ->where('m.product_code', $productCode)
                ->where('m.item_type', 'feature')
                ->where('m.enabled', 1)
                ->where('p.package_code', $packageCode)
                ->pluck('m.item_id')              // berisi feature_code
                ->all();
            $includedSet = array_flip($included);
        }

        $items = $features->map(function ($f) use ($includedSet) {
            return [
                'feature_code' => (string) $f->feature_code,
                'name'         => (string) $f->name,
                'price_addon'  => (int) round($f->price_addon ?? 0),
                'included'     => isset($includedSet[$f->feature_code]),
            ];
        })->values();

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

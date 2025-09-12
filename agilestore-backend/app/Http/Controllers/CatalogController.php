<?php

namespace App\Http\Controllers;

use App\Models\MstProduct;
use App\Models\MstProductPackage;
use App\Models\MstDuration;
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

        return response()->json([
            'success' => true,
            'data'    => [
                'product'   => $product,
                'packages'  => $packages,
                'durations' => $durations,
            ],
        ]);
    }
}

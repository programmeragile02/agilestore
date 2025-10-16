<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AddonService
{
    /** Ambil semua fitur (parent + anak) */
    public function getCatalog(string $productCode): array
    {
        return DB::table('mst_product_features')
            ->where('product_code', $productCode)
            ->where('is_active', 1)
            ->get(['feature_code','name','price_addon','menu_parent_code','item_type'])
            ->map(fn($r) => [
                'feature_code'     => (string)$r->feature_code,
                'name'             => (string)$r->name,
                'price_addon'      => (int)round($r->price_addon ?? 0),
                'menu_parent_code' => $r->menu_parent_code ? (string)$r->menu_parent_code : null,
                'item_type'        => strtoupper((string)$r->item_type ?: 'FEATURE'),
            ])
            ->keyBy('feature_code')
            ->all();
    }

    /** Bangun peta parent->children dengan fallback penebakan parent */
    protected function buildParentMap(array $catalog): array
    {
        // set kandidat parent = semua FEATURE
        $featureParents = array_keys(
            array_filter($catalog, fn($f) => ($f['item_type'] ?? 'FEATURE') === 'FEATURE')
        );
        $featureSet = array_flip($featureParents);

        $parentOf = [];
        foreach ($catalog as $code => $f) {
            $p = $f['menu_parent_code'] ?? null;

            // fallback: jika SUBFEATURE & menu_parent_code kosong, tebak lewat prefix
            if (!$p && ($f['item_type'] ?? 'FEATURE') === 'SUBFEATURE') {
                $parts = explode('.', $code);
                // cari ancestor terdekat yang ada di daftar FEATURE
                while (count($parts) > 1) {
                    array_pop($parts);
                    $cand = implode('.', $parts);
                    if (isset($featureSet[$cand])) { $p = $cand; break; }
                }
            }

            // jika tetap null, biarkan null (berarti dianggap root/parent)
            $parentOf[$code] = $p;
        }
        return $parentOf;
    }

    public function childrenMap(array $catalog): array
    {
        $parentOf = $this->buildParentMap($catalog);
        $byParent = [];
        foreach ($parentOf as $child => $parent) {
            if (!$parent) continue;
            $byParent[$parent] = $byParent[$parent] ?? [];
            $byParent[$parent][] = $child;
        }
        return $byParent;
    }

    public function topPricedParentMap(array $catalog): array
    {
        $parentOf = $this->buildParentMap($catalog);
        $memo = [];
        $getTop = function(string $code) use (&$getTop, &$memo, $catalog, $parentOf) {
            if (isset($memo[$code])) return $memo[$code];
            if (($catalog[$code]['price_addon'] ?? 0) > 0) return $memo[$code] = $code;
            $p = $parentOf[$code] ?? null;
            if (!$p) return $memo[$code] = $code;
            return $memo[$code] = $getTop($p);
        };
        $top = [];
        foreach ($catalog as $code => $_) $top[$code] = $getTop($code);
        return $top;
    }

    public function expandWithDescendants(string $parent, array $childrenMap): array
    {
        $res = [$parent];
        $stack = [$parent];
        while ($stack) {
            $cur = array_pop($stack);
            foreach (($childrenMap[$cur] ?? []) as $ch) {
                if (!in_array($ch, $res, true)) {
                    $res[] = $ch;
                    $stack[] = $ch;
                }
            }
        }
        return $res;
    }

    public function resolvePayableHierarchical(
        string $productCode,
        string $packageCode,
        array $wanted,
        array $alreadyBoughtParentCodes = []
    ): array
    {
        $catalog      = $this->getCatalog($productCode);
        $childrenMap  = $this->childrenMap($catalog);
        $topParentMap = $this->topPricedParentMap($catalog);

        // normalisasi pilihan → parent berharga
        $wantedParents = [];
        foreach (array_unique($wanted) as $code) {
            if (!isset($catalog[$code])) continue;
            $tp = $topParentMap[$code] ?? $code;
            if (($catalog[$tp]['price_addon'] ?? 0) > 0) $wantedParents[] = $tp;
        }
        $wantedParents = array_values(array_unique($wantedParents));

        // parent included paket
        $includedParents = \DB::table('mst_package_matrix as m')
            ->join('mst_product_packages as p','p.id','=','m.package_id')
            ->where('m.product_code',$productCode)
            ->where('m.item_type','feature')->where('m.enabled',1)
            ->where('p.package_code',$packageCode)
            ->pluck('m.item_id')->all();
        $includedParents = array_flip($includedParents);

        // final parent yg dibayar
        $payableParents = [];
        foreach ($wantedParents as $p) {
            if (isset($includedParents[$p])) continue;
            if (in_array($p, $alreadyBoughtParentCodes, true)) continue;
            $payableParents[] = $p;
        }

        // lines & total (hanya parent)
        $lines = []; $sum = 0;
        foreach ($payableParents as $p) {
            $amt  = (int) ($catalog[$p]['price_addon'] ?? 0);
            $lines[] = ['feature_code'=>$p, 'name'=>$catalog[$p]['name'] ?? $p, 'amount'=>$amt];
            $sum += $amt;
        }

        // grant = parent + semua anak
        $grant = [];
        foreach ($payableParents as $p) {
            $grant = array_merge($grant, $this->expandWithDescendants($p, $childrenMap));
        }
        $grant = array_values(array_unique($grant));

        return [
            'total'           => $sum,
            'lines'           => $lines,
            'grant_features'  => $grant,
            'payable_parents' => $payableParents,
            'catalog'         => $catalog,
        ];
    }

    public function midtransItems(array $lines): array
    {
        return array_map(fn($l)=>[
            'id'       => 'addon:'.$l['feature_code'],
            'price'    => (int)$l['amount'],
            'quantity' => 1,
            'name'     => 'Add-on: '.$l['name'],
        ], $lines);
    }
}

// namespace App\Services;

// use App\Models\MstProductFeatures;

// class AddonService
// {
//     public function getCatalog(string $productCode): array
//     {
//         return MstProductFeatures::query()
//             ->where('product_code', $productCode)
//             ->where('is_active', 1)
//             ->get(['feature_code','name','price_addon'])
//             ->map(fn($r) => [
//                 'feature_code' => (string) $r->feature_code,
//                 'name'         => (string) $r->name,
//                 'price_addon'  => (int) round($r->price_addon ?? 0),
//             ])
//             ->keyBy('feature_code')
//             ->all();
//     }

//     /** fitur yang bisa dibeli (tidak included paket) */
//     public function resolvePayable(string $productCode, string $packageCode, array $wanted): array
//     {
//         $catalog = $this->getCatalog($productCode);

//         // fitur yang sudah termasuk paket aktif
//         $included = \DB::table('mst_package_matrix as m')   // <— sebelumnya 'mst_product_package_matrix'
//             ->join('mst_product_packages as p','p.id','=','m.package_id')
//             ->where('m.product_code',$productCode)
//             ->where('m.item_type','feature')->where('m.enabled',1)
//             ->where('p.package_code',$packageCode)
//             ->pluck('m.item_id')->all();
//         $included = array_flip($included);

//         $payable=[];
//         foreach (array_unique($wanted) as $code) {
//             if (!isset($catalog[$code])) continue;
//             if (isset($included[$code])) continue;
//             $payable[] = $catalog[$code];
//         }
//         return $payable;
//     }

//     /** total = sum(price_addon) */
//     public function computeTotal(array $features): array
//     {
//         $lines=[]; $sum=0;
//         foreach ($features as $f) {
//             $amount = (int)$f['price_addon'];
//             $sum   += $amount;
//             $lines[] = [
//                 'feature_code'=>$f['feature_code'],
//                 'name'=>$f['name'],
//                 'amount'=>$amount,
//             ];
//         }
//         return ['total'=>$sum,'lines'=>$lines];
//     }

//     public function midtransItems(array $lines): array
//     {
//         return array_map(fn($l)=>[
//             'id'=>'addon:'.$l['feature_code'],
//             'price'=>(int)$l['amount'],
//             'quantity'=>1,
//             'name'=>'Add-on: '.$l['name'],
//         ], $lines);
//     }
// }
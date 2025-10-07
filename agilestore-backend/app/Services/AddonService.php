<?php

namespace App\Services;

use App\Models\MstProductFeatures;

class AddonService
{
    public function getCatalog(string $productCode): array
    {
        return MstProductFeatures::query()
            ->where('product_code', $productCode)
            ->where('is_active', 1)
            ->get(['feature_code','name','price_addon'])
            ->map(fn($r) => [
                'feature_code' => (string) $r->feature_code,
                'name'         => (string) $r->name,
                'price_addon'  => (int) round($r->price_addon ?? 0),
            ])
            ->keyBy('feature_code')
            ->all();
    }

    /** fitur yang bisa dibeli (tidak included paket) */
    public function resolvePayable(string $productCode, string $packageCode, array $wanted): array
    {
        $catalog = $this->getCatalog($productCode);

        // fitur yang sudah termasuk paket aktif
        $included = \DB::table('mst_package_matrix as m')   // <— sebelumnya 'mst_product_package_matrix'
            ->join('mst_product_packages as p','p.id','=','m.package_id')
            ->where('m.product_code',$productCode)
            ->where('m.item_type','feature')->where('m.enabled',1)
            ->where('p.package_code',$packageCode)
            ->pluck('m.item_id')->all();
        $included = array_flip($included);

        $payable=[];
        foreach (array_unique($wanted) as $code) {
            if (!isset($catalog[$code])) continue;
            if (isset($included[$code])) continue;
            $payable[] = $catalog[$code];
        }
        return $payable;
    }

    /** total = sum(price_addon) */
    public function computeTotal(array $features): array
    {
        $lines=[]; $sum=0;
        foreach ($features as $f) {
            $amount = (int)$f['price_addon'];
            $sum   += $amount;
            $lines[] = [
                'feature_code'=>$f['feature_code'],
                'name'=>$f['name'],
                'amount'=>$amount,
            ];
        }
        return ['total'=>$sum,'lines'=>$lines];
    }

    public function midtransItems(array $lines): array
    {
        return array_map(fn($l)=>[
            'id'=>'addon:'.$l['feature_code'],
            'price'=>(int)$l['amount'],
            'quantity'=>1,
            'name'=>'Add-on: '.$l['name'],
        ], $lines);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class MstPackageMatrix extends Model
{
    protected $table = 'mst_package_matrix';

    // kalau tabel kamu punya created_at & updated_at → true (default)
    public $timestamps = true;

    protected $fillable = [
        'product_code',   // relasi ke MstProduct.code (varchar)
        'package_id',     // relasi ke MstProductPackage.id
        'item_type',      // 'menu' | 'feature'
        'item_id',        // id dari tabel target (menu_id atau feature_id)
        'enabled',
    ];

    protected $casts = [
        'package_id' => 'integer',
        'enabled'    => 'boolean',
    ];

    /** =========================
     *  RELATIONS
     *  ========================= */

    // MstProduct: pakai ownerKey = 'code' (bukan id), sesuaikan bila field kamu beda
    public function product()
    {
        return $this->belongsTo(MstProduct::class, 'product_code', 'code');
    }

    // MstProductPackage: fk = package_id
    public function package()
    {
        return $this->belongsTo(MstProductPackage::class, 'package_id');
    }
}

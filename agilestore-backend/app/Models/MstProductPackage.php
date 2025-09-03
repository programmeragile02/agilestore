<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MstProductPackage extends Model
{
    protected $table = 'mst_product_packages';
    protected $fillable = [
        'product_id',
        'product_code',
        'package_code',
        'name',
        'description',
        'status',
        'notes',
        'order_number'
    ];

    protected $casts = [
        'order_number' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(MstProduct::class, 'product_code', 'product_code');
    }

    public function pricelist()
    {
        return $this->hasMany(MstProductPricelistItem::class, 'package_code', 'package_code');
    }
}

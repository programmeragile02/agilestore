<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MstProduct extends Model
{
    protected $table = "mst_products";

    protected $fillable = [
        'product_code',
        'product_name',
        'category',
        'status',
        'description',
        'db_name',
        'total_features',
        'upstream_updated_at',
    ];

    protected $casts = [
        'upstream_updated_at' => 'datetime',
    ];

    public function packages()
    {
        return $this->hasMany(MstProductPackage::class, 'product_code', 'product_code');
    }

    public function menus()
    {
        return $this->hasMany(MstMenu::class, 'product_code', 'product_code')
            ->whereNull('deleted_at')
            ->orderBy('order_number');
    }

    public function features()
    {
        return $this->hasMany(MstProductFeatures::class, 'product_code', 'product_code');
    }

    public function pricelists()
    {
        return $this->hasMany(MstProductPricelist::class, 'product_code', 'product_code');
    }

    public function packageMatrices()
    {
        // local key = 'code' (varchar), foreign key = 'product_code'
        return $this->hasMany(MstPackageMatrix::class, 'product_code', 'code');
    }

     /* ---- Scopes ---- */
    public function scopeActive($q)
    {
        return $q->where('status', 'active');
    }
}

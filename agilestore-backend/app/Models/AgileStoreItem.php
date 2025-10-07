<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgileStoreItem extends Model
{
    protected $table = 'agile_store_items';

    protected $fillable = [
        'section_id',
        'item_type',
        'title','subtitle','description','cta_label','order',
        'product_code','package_id','duration_id',
        'price_monthly','price_yearly',
        'extras',
    ];

    protected $casts = [
        'order'         => 'integer',
        'price_monthly' => 'decimal:2',
        'price_yearly'  => 'decimal:2',
        'extras'        => 'array',
    ];

    public function section()
    {
        return $this->belongsTo(AgileStoreSection::class, 'section_id');
    }

    // relasi opsional ke domain existing
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_code', 'product_code');
    }

    public function package()
    {
        return $this->belongsTo(ProductPackage::class, 'package_id');
    }

    public function duration()
    {
        return $this->belongsTo(Duration::class, 'duration_id');
    }
}

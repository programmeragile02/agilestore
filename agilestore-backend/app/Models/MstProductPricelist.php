<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Str;

class MstProductPricelist extends Model
{
    protected $table = 'product_pricelists';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'product_id',
        'product_code',
        'currency',
        'tax_mode',
    ];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    public function items()
    {
        return $this->hasMany(MstProductPricelistItem::class, 'pricelist_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(MstProduct::class);
    }
}   

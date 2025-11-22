<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MstProductAddon extends Model
{
    use SoftDeletes;

    protected $table = 'mst_addons';

    protected $fillable = [
        'product_id', 'product_code',
        'addon_code', 'name', 'description',
        'kind', 'pricing_mode',
        'unit_label', 'min_qty', 'step_qty', 'max_qty',
        'currency', 'unit_price',
        'status', 'order_number', 'notes',
    ];

    protected $casts = [
        'min_qty' => 'integer',
        'step_qty' => 'integer',
        'max_qty' => 'integer',
        'unit_price' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(MstProduct::class, 'product_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Str;

class Order extends Model
{
    protected $table = 'orders';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'customer_id',
        'customer_name',
        'customer_email',
        'customer_phone',

        'product_code',
        'package_code',
        'duration_code',
        'pricelist_item_id',

        'price','discount','total','currency',
        'status','payment_status','paid_at',

        'midtrans_order_id','midtrans_transaction_id','payment_type',
        'va_number','bank','permata_va_number','qris_data','snap_token',

        'meta',
    ];
    
    protected $casts = [
        'price'   => 'decimal:2',
        'discount'=> 'decimal:2',
        'total'   => 'decimal:2',
        'paid_at' => 'datetime',
        'meta'    => 'array',
    ];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}

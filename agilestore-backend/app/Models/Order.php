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

        'product_code','product_name',
        'package_code','package_name',
        'duration_code','duration_name',
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

        'is_active'  => 'boolean',
        'start_date' => 'datetime',
        'end_date'   => 'datetime',
    ];

    // Accessor: is_currently_active (tanpa tulis ke DB)
    protected $appends = ['is_currently_active'];

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

    public function getIsCurrentlyActiveAttribute(): bool
    {
        // Aturan: aktif jika flag true dan belum lewat end_date (inclusive)
        $today = now()->startOfDay();
        $end   = $this->end_date instanceof Carbon ? $this->end_date->copy()->startOfDay() : null;

        return (bool) $this->is_active && (is_null($end) || $end->greaterThanOrEqualTo($today));
    }

    // Optional: scope buat query "yang aktif sekarang"
    public function scopeActiveNow($q)
    {
        $today = now()->toDateString();
        return $q->where('is_active', true)
                 ->where(function ($qq) use ($today) {
                     $qq->whereNull('end_date')
                        ->orWhereDate('end_date', '>=', $today);
                 });
    }
}

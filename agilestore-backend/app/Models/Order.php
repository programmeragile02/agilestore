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

        'intent',
        'base_order_id',

        'midtrans_order_id','midtrans_transaction_id','payment_type',
        'va_number','bank','permata_va_number','qris_data','snap_token',

        'is_active','start_date','end_date',

        'meta',
    ];
    
    protected $casts = [
        'price'   => 'decimal:2',
        'discount'=> 'decimal:2',
        'total'   => 'decimal:2',
        'paid_at' => 'datetime',
        'meta'    => 'array',

        'is_active'  => 'boolean',
        'start_date' => 'date',
        'end_date'   => 'date',

        'provision_notified_at' => 'datetime'
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
        if (!$this->is_active) return false;

        $today = now()->startOfDay();
        // pakai optional() agar aman saat end_date null
        $end = optional($this->end_date)->copy()->startOfDay();

        // jika end_date null → dianggap aktif
        if ($end === null) return true;

        return $end->greaterThanOrEqualTo($today);
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

    public function baseOrder()
    {
        return $this->belongsTo(self::class, 'base_order_id');
    }

    public function renewals()
    {
        return $this->hasMany(self::class, 'base_order_id');
    }
}

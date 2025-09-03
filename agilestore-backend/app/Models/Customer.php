<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Customer extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'mst_customers';

    protected $fillable = [
        'profile_photo',
        'full_name',
        'email',
        'password',
        'phone',
        'company',
        'is_active',
    ];

    protected $hidden = ['password','remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected $appends = ['profile_photo_url'];

    /**
     * Normalisasi email dan phone (whatsapp).
     */
    protected static function booted()
    {
        static::creating(function ($m) {
            $m->email = strtolower(trim($m->email));
            $m->phone = self::normalizePhone($m->phone);
        });
        static::updating(function ($m) {
            if ($m->isDirty('email')) $m->email = strtolower(trim($m->email));
            if ($m->isDirty('phone')) $m->phone = self::normalizePhone($m->phone);
        });
    }

    public static function normalizePhone(?string $v): ?string
    {
        if (!$v) return null;
        $s = preg_replace('/\D+/', '', $v);
        if (str_starts_with($s, '0'))  return '+62'.substr($s, 1);
        if (str_starts_with($s, '62')) return '+'.$s;
        return str_starts_with($v, '+') ? $v : '+'.$s;
    }

    /**
     * JWTSubject.
     */

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return ['guard' => 'customer-api'];
    }

    /**
     * Image accessor.
     */
    public function getProfilePhotoUrlAttribute()
    {
        return $this->profile_photo
            ? asset('storage/' . $this->profile_photo)
            : null;
    }

    /**
     * Hasmany Orders.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}

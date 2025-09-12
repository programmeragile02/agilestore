<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class LandingPage extends Model
{
    use SoftDeletes;

    protected $table = 'landing_pages';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'product_code',
        'status',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    public function product()
    {
        return $this->belongsTo(MstProduct::class, 'product_code', 'product_code');
    }

    public function sections()
    {
        return $this->hasMany(LandingPageSection::class)->orderBy('display_order');
    }
}

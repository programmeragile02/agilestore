<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class LandingPageSection extends Model
{
    use SoftDeletes;

    protected $table = 'landing_page_sections';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'landing_page_id',
        'section_key',
        'name',
        'enabled',
        'display_order',
        'content',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'display_order' => 'integer',
        'content' => 'array',
    ];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    public function page()
    {
        return $this->belongsTo(LandingPage::class, 'landing_page_id');
    }
    public function packages()
    {
        return $this->product()->packages();
    }

    public function pricelistItems()
    {
        return $this->product()->pricelistItems();
    }
}

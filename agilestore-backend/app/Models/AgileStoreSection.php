<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgileStoreSection extends Model
{
    use SoftDeletes;

    protected $table = 'agile_store_sections';

    protected $fillable = [
        'key','name','enabled','order','theme','content',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'order'   => 'integer',
        'theme'   => 'array',
        'content' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(AgileStoreItem::class, 'section_id')->orderBy('order');
    }

    // helper scopes
    public function scopeEnabled($q) { return $q->where('enabled', true); }
}

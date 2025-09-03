<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MstMenu extends Model
{
    protected $table = 'mst_menus';

    protected $fillable = [
        'id',
        'parent_id',
        'level',
        'type',            // group | module | menu | submenu
        'title',
        'icon',
        'color',
        'order_number',
        'crud_builder_id',
        'product_code',
        'route_path',
        'is_active',
        'note',
        'created_by',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public $incrementing = true;
    protected $keyType = 'int';

    protected $casts = [
        'id'           => 'integer',
        'parent_id'    => 'integer',
        'level'        => 'integer',
        'order_number' => 'integer',
        'is_active'    => 'boolean',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
        'deleted_at'   => 'datetime',
    ];

    /* Scopes */
    public function scopeForProduct($q, ?string $code)
    {
        if ($code) $q->where('product_code', $code);
        return $q;
    }

    /* Relations */
    public function product()
    {
        return $this->belongsTo(MstProduct::class, 'product_code', 'product_code');
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function recursiveChildren()
    {
        return $this->children()
            ->with('recursiveChildren')
            ->orderBy('order_number');
    }
}

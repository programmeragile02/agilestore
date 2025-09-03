<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MstDuration extends Model
{
    protected $table = 'mst_durations';

    protected $fillable = [
        'name',
        'length',
        'unit',
        'code',
        'is_default',
        'status',
        'notes',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}

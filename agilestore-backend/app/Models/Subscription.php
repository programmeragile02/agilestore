<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasUuids;

    protected $table = 'subscriptions';
    protected $guarded = [];
    protected $casts = [
        'meta'       => 'array',
        'start_date' => 'date',
        'end_date'   => 'date',
        'is_active'  => 'boolean',
    ];

    // Accessor: is_currently_active (tanpa tulis ke DB)
    protected $appends = ['is_currently_active'];

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

    public function scopeCurrentlyActive($q)
    {
        $today = now()->toDateString();
        return $q->where('is_active', true)
                 ->where(function($qq) use ($today) {
                     $qq->whereNull('end_date')
                        ->orWhereDate('end_date', '>=', $today);
                 });
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;

class ExpireOrdersCommand extends Command
{
    // php artisan orders:expire
    protected $signature = 'orders:expire {--dry : Do not persist changes, just show what would happen}';
    protected $description = 'Deactivate paid orders that have passed their end_date';

    public function handle(): int
    {
        $today = now()->toDateString();
        $dry   = (bool) $this->option('dry');

        // Target: order yang status paid, masih aktif, dan end_date < hari ini
        $query = Order::query()
            ->where('status', 'paid')
            ->where('is_active', true)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', $today);

        $count = (clone $query)->count();

        if ($dry) {
            $this->info("[DRY RUN] Would deactivate {$count} order(s).");
            return self::SUCCESS;
        }

        // Update in batches (hindari lock besar)
        $affectedTotal = 0;
        $query->chunkById(500, function ($orders) use (&$affectedTotal) {
            $ids = $orders->pluck('id')->all();
            $affected = Order::whereIn('id', $ids)->update(['is_active' => false]);
            $affectedTotal += $affected;
        });

        $this->info("Deactivated {$affectedTotal} order(s).");
        return self::SUCCESS;
    }
}

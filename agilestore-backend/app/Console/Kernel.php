<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Jalan setiap hari jam 00:15
        $schedule->command('orders:expire')->dailyAt('00:15');

        // Kalau kamu ingin lebih sering (pilih salah satu):
        // $schedule->command('orders:expire')->hourlyAt(5); // tiap jam menit ke-05
        // $schedule->command('orders:expire')->everyThirtyMinutes();
        // $schedule->command('orders:expire')->everyFifteenMinutes();
    }

    // (opsional, Laravel modern auto-discovers command di app/Console/Commands)
    protected $commands = [
        \App\Console\Commands\ExpireOrdersCommand::class,
    ];
}
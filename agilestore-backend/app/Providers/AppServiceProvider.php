<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Midtrans\Config as Midtrans;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Midtrans::$serverKey = config('midtrans.server_key');
        Midtrans::$isProduction = config('midtrans.is_production');
        Midtrans::$isSanitized = config('midtrans.is_sanitized');
        Midtrans::$is3ds = config('midtrans.is_3ds');
    }
}

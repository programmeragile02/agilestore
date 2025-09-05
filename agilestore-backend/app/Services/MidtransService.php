<?php

namespace App\Services;

use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        MidtransConfig::$serverKey    = config('midtrans.server_key');
        MidtransConfig::$isProduction = (bool) config('midtrans.is_production');
        MidtransConfig::$is3ds        = (bool) config('midtrans.is_3ds');
        MidtransConfig::$isSanitized  = true;

        \Log::info('MIDTRANS CONFIG USED', [
        'is_production' => config('midtrans.is_production'),
        'server_key'    => substr((string) config('midtrans.server_key'), 0, 10),
        'client_key'    => substr((string) config('midtrans.client_key'), 0, 10),
]);
    }

    public function createSnapToken(array $payload): string
    {
        try {
            return Snap::getSnapToken($payload);
        } catch (\Throwable $e) {
            \Log::error('MIDTRANS SNAP ERROR', ['msg' => $e->getMessage()]);
            throw $e;
        }
    }

}
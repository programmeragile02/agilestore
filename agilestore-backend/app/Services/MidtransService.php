<?php

namespace App\Services;

use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        MidtransConfig::$serverKey    = config('services.midtrans.server_key');
        MidtransConfig::$isProduction = (bool) config('services.midtrans.is_production');
        MidtransConfig::$is3ds        = (bool) config('services.midtrans.is_3ds');
    }

    public function createSnapToken(array $payload): string
    {
        $trx = Snap::createTransaction($payload);
        return $trx->token ?? '';
    }
}
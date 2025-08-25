<?php

return [
    'paths' => ['api/*'], // Atau ['*'] jika ingin semua route
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Ganti dengan domain tertentu untuk produksi, misal: ['https://example.com']
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
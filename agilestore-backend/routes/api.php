<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderStatusController;
use App\Http\Controllers\Payments\MidtransWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('customer')->group(function () {
    // Guest
    Route::post('/register',        [CustomerAuthController::class, 'register']);
    // get loginnya nanti respon di illuminate ya bukan respon ini masih dumy
    Route::get('/login', function () {
    return response()->json([
        'success' => false,
        'message' => 'Silakan login untuk mengakses resource ini.'
    ], 401);
})->name('login');
    Route::post('/login',           [CustomerAuthController::class, 'login']);
    Route::post('/forgot-password', [CustomerAuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [CustomerAuthController::class, 'resetPassword']);

    // Protected
    Route::middleware('auth:customer-api')->group(function () {
        Route::get('/me',               [CustomerAuthController::class, 'me']);
        Route::post('/logout',          [CustomerAuthController::class, 'logout']);
        Route::post('/refresh',         [CustomerAuthController::class, 'refresh']);

        Route::put('/profile',          [CustomerAuthController::class, 'updateProfile']);
        Route::post('/profile-photo',   [CustomerAuthController::class, 'updateProfilePhoto']);
        Route::delete('/profile-photo', [CustomerAuthController::class, 'deleteProfilePhoto']);
        Route::put('/change-password',  [CustomerAuthController::class, 'changePassword']);

        // list product customer yang dibeli
        Route::get('my-products', [OrderController::class, 'myProducts']);

        // list invoice
        Route::get('invoices',    [OrderController::class, 'myInvoices']);
    });
});

Route::middleware('auth:customer-api')->group(function () {
    Route::post('/orders', [OrderController::class, 'store']);  // create + snap token
    Route::get('/orders/{id}', [OrderController::class, 'show']); // detail order

    // refresh status payment
    Route::post('/orders/{id}/refresh-status', [OrderStatusController::class, 'refresh'])
    ->middleware(['throttle:10,1']);
    // terima callback dari warehouse ketika provisioning ok
    // Route::post('/warehouse/callback', [WarehouseCallbackController::class, 'handle']);
});

// Webhook Midtrans
Route::post('/midtrans/webhook', [MidtransWebhookController::class, 'handle']);

// product catalog
Route::get('/products', [CatalogController::class, 'products']);
Route::get('/products/{product_code}', [CatalogController::class, 'show']);


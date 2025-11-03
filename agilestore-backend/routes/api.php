<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderInvoiceController;
use App\Http\Controllers\OrderStatusController;
use App\Http\Controllers\Payments\MidtransWebhookController;
use App\Http\Controllers\AgileSectionController;
use App\Http\Controllers\AgileStoreController;
use App\Http\Controllers\TranslateBatchController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('customer')->group(function () {
    // oauth google
    Route::post('/oauth/google', [CustomerAuthController::class, 'google']);
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
    Route::post('/forgot-password', [CustomerAuthController::class, 'forgotPassword'])->middleware('throttle:5,1'); // max 5 kali / menit per IP
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
        Route::post('/set-initial-password', [CustomerAuthController::class, 'setInitialPassword']);

        // subscription
        Route::get('/subscriptions', [OrderController::class, 'mySubscriptions']);

        // list product customer yang dibeli
        Route::get('/my-products', [OrderController::class, 'myProducts']);

        // list invoice
        Route::get('/invoices',    [OrderController::class, 'myInvoices']);
    });
});

// check-product: allow guest email check OR auth check
Route::get('/orders/check-product', [OrderController::class, 'checkProduct'])
    ->middleware(['throttle:30,1']); // rate-limit tinggi tapi wajar

// purchase: allow guest to create purchase (auto-register logic lives in controller)
Route::post('/orders', [OrderController::class, 'purchase'])
    ->middleware(['throttle:10,1']); // limit to avoid abuse

/*
 * Protected endpoints (only for authenticated customers)
 */
Route::middleware('auth:customer-api')->group(function () {
    // Renewal (Perpanjangan durasi)
    Route::post('/orders/renew', [OrderController::class, 'renew']);
    // Upgrade paket
    Route::post('/orders/upgrade', [OrderController::class, 'upgrade']);
    // Add On
    Route::post('/orders/addon',    [OrderController::class, 'addon']);

    // detail order
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // download inv
    Route::get('/orders/{id}/invoice', [OrderInvoiceController::class, 'download']);

    // refresh status payment(Pembayaran)
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

// landing page
Route::get('/catalog/products/landing/{codeOrId}', [LandingPageController::class,'show']);
Route::put  ('/catalog/products/{codeOrId}/landing', [LandingPageController::class, 'upsert']);
Route::patch('/catalog/products/{codeOrId}/landing/sections/{sectionId}', [LandingPageController::class, 'updateSection']);
Route::delete('/catalog/products/{codeOrId}/landing/sections/{sectionId}', [LandingPageController::class, 'destroySection']);

// Add on catalog
Route::get('/catalog/addons', [CatalogController::class, 'addons']);
// Agile Store Setting



Route::prefix('agile-store')->group(function () {
    // Sections
    Route::get('/sections',                      [AgileStoreController::class, 'index']);
    Route::get('/sections/{key}',                [AgileStoreController::class, 'showByKey']); // with items
    Route::post('/sections/save',                [AgileStoreController::class, 'saveSection']); // upsert + items
    Route::post('/sections/{id}/toggle',         [AgileStoreController::class, 'toggleEnabled']);
    Route::post('/sections/{id}/duplicate',      [AgileStoreController::class, 'duplicateSection']);
    Route::delete('/sections/{id}',              [AgileStoreController::class, 'destroySection']);

    // Items
    Route::post('/sections/{id}/reorder-items',  [AgileStoreController::class, 'reorderItems']);
    Route::post('/items/save',                   [AgileStoreController::class, 'saveItem']);
    Route::delete('/items/{id}',                 [AgileStoreController::class, 'destroyItem']);

    // Export/Import (opsional)
    Route::get('/sections/{id}/export',          [AgileStoreController::class, 'exportSection']);
    Route::post('/sections/import',              [AgileStoreController::class, 'importSection']);
});
Route::post('/translate-batch', [TranslateBatchController::class, 'translate']);
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // relasi ke customer
            $table->string('customer_id', 64)->index();   // fleksibel: bisa numeric/uuid
            // snapshot customer (immutable)
            $table->string('customer_name', 150);
            $table->string('customer_email', 150)->index();
            $table->string('customer_phone', 50)->nullable();

            // referensi by CODE (sesuai modelmu)
            $table->string('product_code', 64)->index();
            $table->string('package_code', 64)->nullable()->index();
            $table->string('duration_code', 64)->nullable()->index();

            // (opsional) simpan linkage ke pricelist item
            $table->string('pricelist_item_id', 64)->nullable();

            // amounts
            $table->decimal('price', 18, 2)->default(0);
            $table->decimal('discount', 18, 2)->default(0);
            $table->decimal('total', 18, 2)->default(0);
            $table->string('currency', 8)->default('IDR');

            // status
            $table->string('status', 50)->default('pending');       // pending|paid|failed|expired|cancelled
            $table->string('payment_status', 50)->nullable();       // settlement|capture|pending|deny|expire|cancel
            $table->timestamp('paid_at')->nullable();

            // midtrans snapshot
            $table->string('midtrans_order_id', 100)->nullable();
            $table->string('midtrans_transaction_id', 100)->nullable();
            $table->string('payment_type', 50)->nullable();
            $table->string('va_number', 50)->nullable();
            $table->string('bank', 50)->nullable();
            $table->string('permata_va_number', 50)->nullable();
            $table->text('qris_data')->nullable();
            $table->text('snap_token')->nullable();

            $table->json('meta')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

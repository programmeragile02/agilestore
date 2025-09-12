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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();                      // = subscription_instance_id
            $table->uuid('customer_id')->index();
            $table->string('product_code')->index();
            $table->string('product_name')->nullable();

            $table->string('current_package_code');
            $table->string('current_package_name')->nullable();

            $table->string('duration_code');                    // durasi terakhir yang dipakai
            $table->string('duration_name')->nullable();

            $table->date('start_date');                         // awal pertama kali aktif
            $table->date('end_date')->nullable();               // akhir terkini (setelah renew/upgrade)
            $table->boolean('is_active')->default(true);
            $table->string('status')->default('active');        // active|suspended|cancelled|expired|upgraded

            $table->json('meta')->nullable();
            $table->timestamps();

            // 1 produk = 1 subscription per customer
            $table->unique(['customer_id','product_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};

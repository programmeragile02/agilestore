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
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropUnique(['customer_id', 'product_code']); // hapus unique lama
            $table->index(['customer_id', 'product_code']);      // ganti jadi index biasa
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex(['customer_id', 'product_code']);
            $table->unique(['customer_id','product_code']); // rollback
        });
    }
};

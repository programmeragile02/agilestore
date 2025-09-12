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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'intent')) {
                $table->enum('intent', ['purchase','renew','upgrade'])
                  ->default('purchase')
                  ->after('status');
                $table->index('intent', 'idx_orders_intent');
            }

            if (!Schema::hasColumn('orders', 'base_order_id')) {
                $table->uuid('base_order_id')->nullable()->after('intent');
                $table->foreign('base_order_id')
                  ->references('id')->on('orders')
                  ->restrictOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'base_order_id')) {
                $table->dropForeign(['base_order_id']);
                $table->dropColumn('base_order_id');
            }
            if (Schema::hasColumn('orders', 'intent')) {
                $table->dropIndex('idx_orders_intent');
                $table->dropColumn('intent');
            }
        });
    }
};

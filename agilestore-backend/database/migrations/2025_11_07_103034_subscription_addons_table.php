<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('subscription_addons')) {
            Schema::create('subscription_addons', function (Blueprint $t) {
                $t->id();
                $t->uuid('subscription_instance_id')->index();
                $t->string('feature_code', 150)->index();
                $t->string('feature_name', 255)->nullable();
                $t->bigInteger('price_amount')->default(0);
                $t->string('currency', 10)->default('IDR');
                $t->uuid('order_id')->nullable()->index();              // order aktivasi Rp0
                $t->string('midtrans_order_id', 100)->nullable();
                $t->dateTime('purchased_at')->nullable();
                $t->date('billable_from_start')->nullable();            // <<< tanggal mulai ditagih
                $t->boolean('follow_base_duration')->default(true);     // ikuti durasi base
                $t->string('cycle_code', 20)->nullable();               // M1 / M12 / D30 dll
                $t->timestamps();
                $t->unique(['subscription_instance_id','feature_code']);
            });
        }
    }
    public function down(): void {
        Schema::dropIfExists('subscription_addons');
    }
};
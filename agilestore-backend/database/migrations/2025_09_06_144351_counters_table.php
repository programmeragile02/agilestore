<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('counters', function (Blueprint $table) {
            $table->string('key')->primary();        // contoh: "order:20250906"
            $table->unsignedBigInteger('value')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('counters');
    }
};

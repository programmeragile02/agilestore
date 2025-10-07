<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        // MySQL enum: tambahkan 'addon'
        DB::statement("ALTER TABLE `orders` MODIFY `intent` ENUM('purchase','renew','upgrade','addon')");
    }
    public function down(): void {
        DB::statement("ALTER TABLE `orders` MODIFY `intent` ENUM('purchase','renew','upgrade')");
    }
};
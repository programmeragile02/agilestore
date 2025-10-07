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
        Schema::table('customer_password_reset_tokens', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->index();
            $table->unsignedTinyInteger('attempts')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_password_reset_tokens', function (Blueprint $table) {
            $table->dropColumn(['expires_at','attempts']);
        });
    }
};

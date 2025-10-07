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
        Schema::table('mst_customers', function (Blueprint $table) {
            $table->string('google_id', 64)->nullable()->unique()->after('id');
            $table->string('provider', 30)->nullable()->after('google_id');
            $table->string('provider_avatar_url', 500)->nullable()->after('profile_photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mst_customers', function (Blueprint $table) {
            $table->dropColumn(['google_id','provider','provider_avatar_url']);
        });
    }
};

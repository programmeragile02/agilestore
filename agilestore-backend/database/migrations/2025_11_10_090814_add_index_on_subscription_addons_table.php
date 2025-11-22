<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // nama index yang konsisten agar mudah di-drop di down()
    private string $indexName = 'uq_addons_instance_addon';

    public function up(): void
    {
        // 1) Bersihkan duplikat: simpan baris dengan id terbesar (anggap paling baru)
        //    untuk pasangan (subscription_instance_id, addon_code)
        DB::statement("
            DELETE sa1 FROM subscription_addons sa1
            JOIN subscription_addons sa2
              ON sa1.subscription_instance_id = sa2.subscription_instance_id
             AND COALESCE(sa1.addon_code, '')   = COALESCE(sa2.addon_code, '')
             AND sa1.id < sa2.id
            WHERE sa1.addon_code IS NOT NULL
              AND sa1.addon_code <> ''
        ");

        // 2) Tambah unique index bila belum ada
        $exists = DB::table('information_schema.statistics')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name',   'subscription_addons')
            ->where('index_name',   $this->indexName)
            ->exists();

        if (! $exists) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                // pastikan kolom addon_code sudah ada dan cukup panjang
                // lalu buat unique index gabungan
                $table->unique(['subscription_instance_id', 'addon_code'], $this->indexName);
            });
        }
    }

    public function down(): void
    {
        // drop unique index jika ada
        $exists = DB::table('information_schema.statistics')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name',   'subscription_addons')
            ->where('index_name',   $this->indexName)
            ->exists();

        if ($exists) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropUnique($this->indexName);
            });
        }
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Bersihkan data kosong jadi NULL (kalau ada)
        DB::statement("UPDATE subscription_addons SET feature_code = NULL WHERE feature_code = ''");

        // 2) Ubah feature_code jadi NULLABLE (MySQL/MariaDB)
        //    Sesuaikan panjang tipe Varchar jika skema kamu pakai panjang lain
        DB::statement("ALTER TABLE subscription_addons MODIFY feature_code VARCHAR(191) NULL");

        // 3) Pastikan ada index unik per (instance_id, feature_code) — khusus FEATURE
        //    (Tetap ada; biar tidak double, drop dulu kalau nama lama bentrok)
        try {
            DB::statement("ALTER TABLE subscription_addons DROP INDEX uq_addons_instance_feature");
        } catch (\Throwable $e) {
            // abaikan jika index belum ada
        }
        DB::statement("CREATE UNIQUE INDEX uq_addons_instance_feature ON subscription_addons (subscription_instance_id, feature_code)");

        // 4) Tambah unique index untuk MASTER_ADDON: (instance_id, addon_code)
        try {
            DB::statement("CREATE UNIQUE INDEX uq_addons_instance_addon ON subscription_addons (subscription_instance_id, addon_code)");
        } catch (\Throwable $e) {
            // kalau sudah ada, abaikan
        }
    }

    public function down(): void
    {
        // rollback sederhana: drop index addon & kembalikan NOT NULL (hati-hati kalau ada NULL)
        try {
            DB::statement("DROP INDEX uq_addons_instance_addon ON subscription_addons");
        } catch (\Throwable $e) {}

        // Kembalikan feature_code ke NOT NULL (bisa gagal jika ada NULL; amankan dulu)
        DB::statement("UPDATE subscription_addons SET feature_code = '' WHERE feature_code IS NULL");
        DB::statement("ALTER TABLE subscription_addons MODIFY feature_code VARCHAR(191) NOT NULL");

        // Pulihkan index feature (opsional, tergantung nama awal)
        try {
            DB::statement("DROP INDEX uq_addons_instance_feature ON subscription_addons");
        } catch (\Throwable $e) {}
    }
};
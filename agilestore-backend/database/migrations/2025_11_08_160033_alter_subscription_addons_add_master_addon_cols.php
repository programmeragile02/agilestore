<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Tambah kolom-kolom MASTER_ADDON secara defensif (only-if-not-exists)

        Schema::table('subscription_addons', function (Blueprint $table) {
            if (!Schema::hasColumn('subscription_addons', 'addon_code')) {
                // taruh setelah feature_code biar rapi
                $table->string('addon_code', 255)->nullable()->after('feature_code')
                      ->comment('Kode master add-on (qty-based). Null untuk baris fitur parent');
            }
            if (!Schema::hasColumn('subscription_addons', 'qty')) {
                $table->unsignedInteger('qty')->nullable()->default(1)->after('addon_code')
                      ->comment('Kuantitas untuk master add-on; default 1');
            }
        });

        if (!Schema::hasColumn('subscription_addons', 'currency')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->string('currency', 8)->nullable()->after('kind');
            });
        }

        if (!Schema::hasColumn('subscription_addons', 'unit_price')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                // sesuaikan precision/scale sesuai kebutuhanmu
                $table->decimal('unit_price', 12, 2)->nullable()->after('currency');
            });
        }

        if (!Schema::hasColumn('subscription_addons', 'unit_label')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->string('unit_label', 32)->nullable()->after('unit_price');
            });
        }

        if (!Schema::hasColumn('subscription_addons', 'min_qty')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->unsignedInteger('min_qty')->nullable()->default(1)->after('unit_label');
            });
        }

        if (!Schema::hasColumn('subscription_addons', 'step_qty')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->unsignedInteger('step_qty')->nullable()->default(1)->after('min_qty');
            });
        }

        if (!Schema::hasColumn('subscription_addons', 'max_qty')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->unsignedInteger('max_qty')->nullable()->after('step_qty');
            });
        }

        if (!Schema::hasColumn('subscription_addons', 'pricing_mode')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                // contoh nilai: per_unit | tier | flat
                $table->string('pricing_mode', 16)->nullable()->after('max_qty');
            });
        }

        // (Opsional) jika kolom 'kind' belum ada di project lain, lindungi juga
        if (!Schema::hasColumn('subscription_addons', 'kind')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                // kalau mau ubah tipe/enum existing, gunakan doctrine/dbal lalu ->change()
                $table->string('kind', 20)->nullable()->default('FEATURE')->after('id');
            });
        }
    }

    public function down(): void
    {
        // Hapus kolom secara aman (cek dulu baru drop)
        Schema::table('subscription_addons', function (Blueprint $table) {
            if (!Schema::hasColumn('subscription_addons', 'addon_code')) {
                // taruh setelah feature_code biar rapi
                $table->string('addon_code', 255)->nullable()->after('feature_code');
            }
            if (!Schema::hasColumn('subscription_addons', 'qty')) {
                $table->unsignedInteger('qty')->nullable()->default(1)->after('addon_code');
            }
        });

        if (Schema::hasColumn('subscription_addons', 'pricing_mode')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropColumn('pricing_mode');
            });
        }
        if (Schema::hasColumn('subscription_addons', 'max_qty')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropColumn('max_qty');
            });
        }
        if (Schema::hasColumn('subscription_addons', 'step_qty')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropColumn('step_qty');
            });
        }
        if (Schema::hasColumn('subscription_addons', 'min_qty')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropColumn('min_qty');
            });
        }
        if (Schema::hasColumn('subscription_addons', 'unit_label')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropColumn('unit_label');
            });
        }
        if (Schema::hasColumn('subscription_addons', 'unit_price')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropColumn('unit_price');
            });
        }
        if (Schema::hasColumn('subscription_addons', 'currency')) {
            Schema::table('subscription_addons', function (Blueprint $table) {
                $table->dropColumn('currency');
            });
        }

        // Biasanya 'kind' sudah lama ada—jangan di-drop kalau dipakai logic lain.
        // Kalau memang migration ini yang pertama kali menambah 'kind' dan ingin revert:
        // if (Schema::hasColumn('subscription_addons', 'kind')) {
        //     Schema::table('subscription_addons', function (Blueprint $table) {
        //         $table->dropColumn('kind');
        //     });
        // }
    }
};
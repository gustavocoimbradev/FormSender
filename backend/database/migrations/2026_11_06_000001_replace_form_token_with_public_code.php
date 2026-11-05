<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->string('code', 32)->nullable()->unique()->after('allowed_domains');
        });

        // Forms that already exist get their public code too.
        DB::table('forms')->whereNull('code')->pluck('id')->each(function (int $id): void {
            do {
                $code = strtolower(Str::random(20));
            } while (DB::table('forms')->where('code', $code)->exists());

            DB::table('forms')->where('id', $id)->update(['code' => $code]);
        });

        Schema::table('forms', function (Blueprint $table): void {
            $table->dropUnique(['token_hash']);
            $table->dropColumn(['token', 'token_hash']);
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->text('token')->nullable()->after('allowed_domains');
            $table->string('token_hash', 64)->nullable()->unique()->after('token');
        });

        Schema::table('forms', function (Blueprint $table): void {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};

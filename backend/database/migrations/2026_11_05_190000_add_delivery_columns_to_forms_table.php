<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->json('fields')->default('[]')->after('name');
            $table->json('destinations')->default('[]')->after('fields');
            $table->json('allowed_domains')->default('[]')->after('destinations');
            $table->text('token')->nullable()->after('allowed_domains');
            $table->string('token_hash', 64)->nullable()->unique()->after('token');
        });

        DB::table('forms')->whereNull('token')->pluck('id')->each(function (int $id): void {
            $token = 'fs_'.Str::random(48);

            DB::table('forms')->where('id', $id)->update([
                'token' => Crypt::encryptString($token),
                'token_hash' => hash('sha256', $token),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->dropUnique(['token_hash']);
            $table->dropColumn(['fields', 'destinations', 'allowed_domains', 'token', 'token_hash']);
        });
    }
};

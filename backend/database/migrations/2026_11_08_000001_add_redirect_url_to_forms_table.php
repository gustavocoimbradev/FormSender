<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->string('redirect_url', 2048)->nullable()->after('allowed_domains');
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->dropColumn('redirect_url');
        });
    }
};

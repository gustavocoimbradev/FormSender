<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A form no longer redirects anywhere: submitting always answers with JSON.
     */
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->dropColumn(['response_type', 'redirect_url']);
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->string('response_type')->default('json')->after('allowed_domains');
            $table->string('redirect_url', 2048)->nullable()->after('response_type');
        });
    }
};

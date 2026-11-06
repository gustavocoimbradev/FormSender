<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->string('response_type')->default('json')->after('allowed_domains');
        });

        // A form that already had a thank-you page was redirecting browsers: keep it that way.
        DB::table('forms')->whereNotNull('redirect_url')->update(['response_type' => 'redirect']);
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->dropColumn('response_type');
        });
    }
};

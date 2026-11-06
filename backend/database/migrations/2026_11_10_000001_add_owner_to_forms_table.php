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
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        // Forms made before accounts had their own forms belong to the administrator who installed it.
        $owner = DB::table('users')->where('role', 'admin')->orderByDesc('is_owner')->orderBy('id')->value('id');

        if ($owner !== null) {
            DB::table('forms')->whereNull('user_id')->update(['user_id' => $owner]);
        }
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};

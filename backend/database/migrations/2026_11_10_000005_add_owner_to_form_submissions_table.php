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
        // Whose message it is, kept even after the form is deleted: the daily limit of an account counts what it received.
        Schema::table('form_submissions', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        DB::statement('UPDATE form_submissions SET user_id = (SELECT forms.user_id FROM forms WHERE forms.id = form_submissions.form_id) WHERE form_id IS NOT NULL');
    }

    public function down(): void
    {
        Schema::table('form_submissions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};

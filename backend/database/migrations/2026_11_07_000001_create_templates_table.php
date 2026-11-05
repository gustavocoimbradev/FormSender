<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('subject');
            $table->longText('html');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // A form without a template uses the default one; deleting a template sends its forms back to it.
        Schema::table('forms', function (Blueprint $table): void {
            $table->foreignId('template_id')->nullable()->after('allowed_domains')->constrained('templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('template_id');
        });

        Schema::dropIfExists('templates');
    }
};

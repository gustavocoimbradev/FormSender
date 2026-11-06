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
            $table->json('confirmed_destinations')->default('[]')->after('destinations');
        });

        // Forms that exist before destinations had to be confirmed keep delivering to every one of them.
        DB::table('forms')->orderBy('id')->each(function (object $form): void {
            DB::table('forms')->where('id', $form->id)->update(['confirmed_destinations' => $form->destinations]);
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->dropColumn('confirmed_destinations');
        });
    }
};

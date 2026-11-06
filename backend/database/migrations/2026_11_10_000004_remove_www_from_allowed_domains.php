<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Allowed sites are now the domain itself, which also covers its www version: an entry saved as `www.company.com`
     * becomes `company.com`.
     */
    public function up(): void
    {
        DB::table('forms')->orderBy('id')->each(function (object $form): void {
            $domains = json_decode((string) $form->allowed_domains, true) ?: [];
            $clean = array_values(array_unique(array_map(fn (string $domain): string => (string) preg_replace('/^www\./', '', $domain), $domains)));

            if ($clean !== $domains) {
                DB::table('forms')->where('id', $form->id)->update(['allowed_domains' => json_encode($clean, JSON_THROW_ON_ERROR)]);
            }
        });
    }

    public function down(): void
    {
        // Nothing to undo: the www version was never removed from what a domain allows.
    }
};

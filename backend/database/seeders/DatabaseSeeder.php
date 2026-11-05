<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * No users are seeded on purpose: the first admin is created through POST /api/setup.
     */
    public function run(): void
    {
        $this->call(SmtpSettingsSeeder::class);
        $this->call(ExampleFormSeeder::class);
    }
}

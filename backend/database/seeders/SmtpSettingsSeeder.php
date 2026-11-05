<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SmtpSettingsSeeder extends Seeder
{
    /**
     * Points the app at the local Mailpit (a fake SMTP server that catches every
     * email) until someone saves real SMTP settings through the API.
     * Existing settings are never overwritten, so this is safe to run on every `make up`.
     */
    public function run(): void
    {
        Setting::firstOrCreate(['key' => 'smtp'], ['value' => [
            'host' => 'mailpit',
            'port' => 1025,
            'username' => null,
            'password' => null,
            'encryption' => null,
            'from_address' => 'no-reply@formsender.test',
            'from_name' => 'FormSender',
        ]]);
    }
}

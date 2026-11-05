<?php

declare(strict_types=1);

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\SmtpSettingsSeeder;

it('seeds the local Mailpit as the initial smtp provider', function (): void {
    $this->seed(SmtpSettingsSeeder::class);

    expect(Setting::where('key', 'smtp')->sole()->value)->toBe([
        'host' => 'mailpit',
        'port' => 1025,
        'username' => null,
        'password' => null,
        'encryption' => null,
        'from_address' => 'no-reply@formsender.test',
        'from_name' => 'FormSender',
    ]);
});

it('never overwrites smtp settings that were already saved', function (): void {
    Setting::create(['key' => 'smtp', 'value' => ['host' => 'smtp.example.com', 'port' => 587]]);

    $this->seed(SmtpSettingsSeeder::class);

    expect(Setting::where('key', 'smtp')->sole()->value)->toBe(['host' => 'smtp.example.com', 'port' => 587]);
});

it('can run more than once without duplicating the settings', function (): void {
    $this->seed(SmtpSettingsSeeder::class);
    $this->seed(SmtpSettingsSeeder::class);

    expect(Setting::where('key', 'smtp')->count())->toBe(1);
});

it('keeps the settings editable through the api after seeding', function (): void {
    $this->seed(SmtpSettingsSeeder::class);
    actingAsAdmin();

    $this->putJson('/api/settings', ['smtp' => [
        'host' => 'smtp.example.com',
        'port' => 465,
        'encryption' => 'ssl',
        'from_address' => 'no-reply@example.com',
    ]])->assertOk();

    $this->seed(SmtpSettingsSeeder::class);

    $this->getJson('/api/settings')->assertJsonPath('data.smtp.host', 'smtp.example.com');
});

it('lets the full seeder run without creating any user', function (): void {
    $this->seed(DatabaseSeeder::class);

    expect(User::count())->toBe(0)->and(Setting::where('key', 'smtp')->exists())->toBeTrue();
});

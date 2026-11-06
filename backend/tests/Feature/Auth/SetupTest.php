<?php

declare(strict_types=1);

use App\Enums\Role;
use App\Models\Setting;
use App\Models\User;

function setupPayload(array $overrides = []): array
{
    return [
        'name' => 'Owner',
        'email' => 'owner@example.com',
        'password' => 'strong-pass-123',
        ...$overrides,
    ];
}

it('creates the initial admin account', function (): void {
    $this->postJson('/api/setup', setupPayload())
        ->assertCreated()
        ->assertJsonPath('data.email', 'owner@example.com')
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonMissingPath('data.is_owner')
        ->assertJsonMissingPath('data.password');

    $admin = User::where('email', 'owner@example.com')->first();

    expect($admin->role)->toBe(Role::Admin)
        ->and($admin->password)->not->toBe('strong-pass-123');
});

it('lets the created admin log in', function (): void {
    $this->postJson('/api/setup', setupPayload())->assertCreated();

    $this->postJson('/api/auth/login', ['email' => 'owner@example.com', 'password' => 'strong-pass-123'])
        ->assertOk()
        ->assertJsonPath('data.role', 'admin');
});

it('defaults the admin name when none is sent', function (): void {
    $this->postJson('/api/setup', setupPayload(['name' => null]))
        ->assertCreated()
        ->assertJsonPath('data.name', 'Admin');
});

it('cannot be used once an admin exists', function (): void {
    User::factory()->admin()->create();

    $this->postJson('/api/setup', setupPayload())->assertForbidden();

    expect(User::count())->toBe(1);
});

it('cannot be used twice', function (): void {
    $this->postJson('/api/setup', setupPayload())->assertCreated();
    $this->postJson('/api/setup', setupPayload(['email' => 'other@example.com']))->assertForbidden();

    expect(User::count())->toBe(1);
});

it('can still be used when only regular users exist', function (): void {
    User::factory()->create();

    $this->postJson('/api/setup', setupPayload())->assertCreated();

    expect(User::where('role', Role::Admin)->count())->toBe(1);
});

it('validates the setup payload', function (array $overrides, string $errorKey): void {
    $this->postJson('/api/setup', setupPayload($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);

    expect(User::count())->toBe(0);
})->with([
    'missing email' => [['email' => null], 'email'],
    'invalid email' => [['email' => 'nope'], 'email'],
    'missing password' => [['password' => null], 'password'],
    'short password' => [['password' => 'short'], 'password'],
]);

it('reports that the setup is still pending', function (): void {
    $this->getJson('/api/setup')
        ->assertOk()
        ->assertExactJson(['data' => ['completed' => false, 'registration_open' => false]]);
});

it('reports that the setup is done once an admin exists', function (): void {
    User::factory()->admin()->create();

    $this->getJson('/api/setup')
        ->assertOk()
        ->assertExactJson(['data' => ['completed' => true, 'registration_open' => false]]);
});

it('does not treat regular users as a finished setup', function (): void {
    User::factory()->create();

    $this->getJson('/api/setup')->assertJsonPath('data.completed', false);
});

it('exposes nothing but the setup status', function (): void {
    User::factory()->owner()->create(['email' => 'owner@example.com']);

    expect($this->getJson('/api/setup')->getContent())->not->toContain('owner@example.com');
});

function smtpForSetup(array $overrides = []): array
{
    return [
        'host' => 'smtp.company.com',
        'port' => 587,
        'username' => 'mailer@company.com',
        'password' => 'mail-secret',
        'encryption' => 'tls',
        'from_address' => 'no-reply@company.com',
        'from_name' => 'My Company',
        ...$overrides,
    ];
}

it('saves the smtp settings together with the initial admin', function (): void {
    $this->postJson('/api/setup', setupPayload(['smtp' => smtpForSetup()]))->assertCreated();

    expect(Setting::where('key', 'smtp')->sole()->value)->toBe(smtpForSetup());
});

it('lets the new admin read the smtp settings back', function (): void {
    $this->postJson('/api/setup', setupPayload(['smtp' => smtpForSetup()]))->assertCreated();
    $token = $this->postJson('/api/auth/login', ['email' => 'owner@example.com', 'password' => 'strong-pass-123'])->json('token');

    $this->withToken($token)->getJson('/api/settings')
        ->assertOk()
        ->assertJsonPath('data.smtp.host', 'smtp.company.com')
        ->assertJsonPath('data.smtp.from_address', 'no-reply@company.com');
});

it('replaces the smtp settings that already existed', function (): void {
    Setting::create(['key' => 'smtp', 'value' => ['host' => 'mailpit', 'port' => 1025]]);

    $this->postJson('/api/setup', setupPayload(['smtp' => smtpForSetup()]))->assertCreated();

    expect(Setting::where('key', 'smtp')->count())->toBe(1)
        ->and(Setting::where('key', 'smtp')->sole()->value['host'])->toBe('smtp.company.com');
});

it('keeps the existing smtp settings when none are sent', function (): void {
    Setting::create(['key' => 'smtp', 'value' => ['host' => 'mailpit', 'port' => 1025]]);

    $this->postJson('/api/setup', setupPayload())->assertCreated();

    expect(Setting::where('key', 'smtp')->sole()->value['host'])->toBe('mailpit');
});

it('accepts a server without login and without encryption', function (): void {
    $this->postJson('/api/setup', setupPayload(['smtp' => smtpForSetup(['username' => null, 'password' => null, 'encryption' => null, 'from_name' => null])]))
        ->assertCreated();

    expect(Setting::where('key', 'smtp')->sole()->value)
        ->toMatchArray(['username' => null, 'password' => null, 'encryption' => null]);
});

it('validates the smtp settings and creates nothing when they are wrong', function (array $smtp, string $errorKey): void {
    $this->postJson('/api/setup', setupPayload(['smtp' => $smtp]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);

    expect(User::count())->toBe(0)->and(Setting::where('key', 'smtp')->exists())->toBeFalse();
})->with([
    'missing host' => [fn () => smtpForSetup(['host' => null]), 'smtp.host'],
    'missing port' => [fn () => smtpForSetup(['port' => null]), 'smtp.port'],
    'port out of range' => [fn () => smtpForSetup(['port' => 70000]), 'smtp.port'],
    'invalid encryption' => [fn () => smtpForSetup(['encryption' => 'none']), 'smtp.encryption'],
    'missing from address' => [fn () => smtpForSetup(['from_address' => null]), 'smtp.from_address'],
    'invalid from address' => [fn () => smtpForSetup(['from_address' => 'nope']), 'smtp.from_address'],
]);

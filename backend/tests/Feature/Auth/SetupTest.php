<?php

declare(strict_types=1);

use App\Enums\Role;
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
        ->assertJsonPath('data.is_owner', true)
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

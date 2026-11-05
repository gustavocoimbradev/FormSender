<?php

declare(strict_types=1);

use App\Enums\Role;
use App\Models\User;

it('creates a user with the given role from the command line', function (): void {
    $this->artisan('user:create', [
        'email' => 'new@example.com',
        '--name' => 'New',
        '--role' => 'admin',
        '--password' => 'strong-pass-123',
    ])->assertSuccessful();

    expect(User::where('email', 'new@example.com')->first()->role)->toBe(Role::Admin);
});

it('rejects an invalid role', function (): void {
    $this->artisan('user:create', [
        'email' => 'new@example.com',
        '--role' => 'root',
        '--password' => 'strong-pass-123',
    ])->assertFailed();

    expect(User::count())->toBe(0);
});

<?php

declare(strict_types=1);

use App\Models\User;

it('lists users for an admin, paginated and without passwords', function (): void {
    actingAsAdmin();
    User::factory()->count(2)->create();

    $this->getJson('/api/users')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data' => [['id', 'name', 'email', 'role']], 'links', 'meta'])
        ->assertJsonMissingPath('data.0.password');
});

it('forbids regular users from listing users', function (): void {
    actingAsUser();

    $this->getJson('/api/users')->assertForbidden();
});

it('requires authentication to list users', function (): void {
    $this->getJson('/api/users')->assertUnauthorized();
});

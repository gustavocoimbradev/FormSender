<?php

declare(strict_types=1);

use App\Enums\Role;
use App\Models\User;

function userPayload(array $overrides = []): array
{
    return [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'strong-pass-123',
        ...$overrides,
    ];
}

it('lets an admin create a user, defaulting the role to user', function (): void {
    actingAsAdmin();

    $this->postJson('/api/users', userPayload())
        ->assertCreated()
        ->assertJsonPath('data.email', 'jane@example.com')
        ->assertJsonPath('data.role', 'user')
        ->assertJsonPath('data.is_owner', false)
        ->assertJsonMissingPath('data.password');

    expect(User::where('email', 'jane@example.com')->first()->password)->not->toBe('strong-pass-123');
});

it('lets an admin create another admin', function (): void {
    actingAsAdmin();

    $this->postJson('/api/users', userPayload(['role' => 'admin']))
        ->assertCreated()
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonPath('data.is_owner', false);
});

it('validates the user payload on create', function (array $overrides, string $errorKey): void {
    actingAsAdmin();
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/users', userPayload($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);
})->with([
    'missing name' => [['name' => null], 'name'],
    'missing email' => [['email' => null], 'email'],
    'invalid email' => [['email' => 'nope'], 'email'],
    'taken email' => [['email' => 'taken@example.com'], 'email'],
    'short password' => [['password' => 'short'], 'password'],
    'invalid role' => [['role' => 'root'], 'role'],
]);

it('forbids regular users from managing users', function (): void {
    actingAsUser();
    $target = User::factory()->create();

    $this->postJson('/api/users', userPayload())->assertForbidden();
    $this->getJson("/api/users/{$target->id}")->assertForbidden();
    $this->putJson("/api/users/{$target->id}", ['name' => 'X'])->assertForbidden();
    $this->deleteJson("/api/users/{$target->id}")->assertForbidden();
});

it('shows a user and returns 404 for unknown ones', function (): void {
    actingAsAdmin();
    $target = User::factory()->create();

    $this->getJson("/api/users/{$target->id}")->assertOk()->assertJsonPath('data.id', $target->id);
    $this->getJson('/api/users/999999')->assertNotFound();
});

it('lets an admin update a user and revoke tokens when the password changes', function (): void {
    actingAsAdmin();
    $target = User::factory()->create(['email' => 'old@example.com']);
    $target->createToken('api');

    $this->putJson("/api/users/{$target->id}", ['name' => 'Renamed', 'email' => 'new@example.com'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed');

    expect($target->tokens()->count())->toBe(1);

    $this->patchJson("/api/users/{$target->id}", ['password' => 'another-strong-pass'])->assertOk();

    expect($target->fresh()->email)->toBe('new@example.com')
        ->and($target->tokens()->count())->toBe(0);
});

it('lets an admin promote a user to admin', function (): void {
    actingAsAdmin();
    $target = User::factory()->create();

    $this->patchJson("/api/users/{$target->id}", ['role' => 'admin'])
        ->assertOk()
        ->assertJsonPath('data.role', 'admin');
});

it('does not let an admin change the role of another admin', function (): void {
    actingAsAdmin();
    $otherAdmin = User::factory()->admin()->create();

    $this->patchJson("/api/users/{$otherAdmin->id}", ['role' => 'user'])->assertForbidden();

    expect($otherAdmin->fresh()->role)->toBe(Role::Admin);
});

it('lets the owner demote another admin back to user', function (): void {
    actingAsOwner();
    $otherAdmin = User::factory()->admin()->create();

    $this->patchJson("/api/users/{$otherAdmin->id}", ['role' => 'user'])
        ->assertOk()
        ->assertJsonPath('data.role', 'user');
});

it('does not let anyone change the role of the owner', function (): void {
    $owner = User::factory()->owner()->create();
    actingAsAdmin();

    $this->patchJson("/api/users/{$owner->id}", ['role' => 'user'])->assertForbidden();

    actingAsOwner(User::find($owner->id));

    $this->patchJson("/api/users/{$owner->id}", ['role' => 'user'])->assertForbidden();
    expect($owner->fresh()->role)->toBe(Role::Admin);
});

it('does not let an admin change their own role', function (): void {
    $admin = actingAsAdmin();

    $this->patchJson("/api/users/{$admin->id}", ['role' => 'user'])->assertForbidden();
});

it('accepts an unchanged role in the payload', function (): void {
    $admin = actingAsAdmin();

    $this->putJson("/api/users/{$admin->id}", ['name' => 'Me', 'role' => 'admin'])->assertOk();
});

it('lets an admin edit their own account but not other admins or the owner', function (): void {
    $admin = actingAsAdmin();
    $otherAdmin = User::factory()->admin()->create();
    $owner = User::factory()->owner()->create();

    $this->patchJson("/api/users/{$admin->id}", ['name' => 'Me'])->assertOk();
    $this->patchJson("/api/users/{$otherAdmin->id}", ['name' => 'X'])->assertForbidden();
    $this->patchJson("/api/users/{$owner->id}", ['name' => 'X'])->assertForbidden();
});

it('lets the owner edit other admins', function (): void {
    actingAsOwner();
    $otherAdmin = User::factory()->admin()->create();

    $this->patchJson("/api/users/{$otherAdmin->id}", ['name' => 'Changed'])->assertOk();
});

it('lets an admin delete a regular user and revokes their tokens', function (): void {
    actingAsAdmin();
    $target = User::factory()->create();
    $target->createToken('api');

    $this->deleteJson("/api/users/{$target->id}")->assertNoContent();

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
    $this->assertDatabaseCount('personal_access_tokens', 0);
});

it('does not let an admin delete themselves, other admins or the owner', function (): void {
    $admin = actingAsAdmin();
    $otherAdmin = User::factory()->admin()->create();
    $owner = User::factory()->owner()->create();

    $this->deleteJson("/api/users/{$admin->id}")->assertForbidden();
    $this->deleteJson("/api/users/{$otherAdmin->id}")->assertForbidden();
    $this->deleteJson("/api/users/{$owner->id}")->assertForbidden();
});

it('lets the owner delete other admins but never themselves', function (): void {
    $owner = actingAsOwner();
    $otherAdmin = User::factory()->admin()->create();

    $this->deleteJson("/api/users/{$otherAdmin->id}")->assertNoContent();
    $this->deleteJson("/api/users/{$owner->id}")->assertForbidden();
});

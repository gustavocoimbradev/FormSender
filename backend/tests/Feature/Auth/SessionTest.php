<?php

declare(strict_types=1);

use App\Models\User;

it('returns the authenticated user', function (): void {
    $user = actingAsUser();

    $this->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.role', 'user')
        ->assertJsonMissingPath('data.password');
});

it('requires authentication to read the current user', function (): void {
    $this->getJson('/api/auth/me')->assertUnauthorized();
});

it('revokes only the current token on logout', function (): void {
    $user = User::factory()->create();
    $current = $user->createToken('current')->plainTextToken;
    $user->createToken('other');

    $this->withToken($current)->postJson('/api/auth/logout')->assertNoContent();

    expect($user->tokens()->count())->toBe(1);
    expect($user->tokens()->first()->name)->toBe('other');
});

it('rejects a token after logout', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('current')->plainTextToken;

    $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();

    app('auth')->forgetGuards();

    $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
});

it('rejects an expired token', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('api')->plainTextToken;

    $this->travel(config('sanctum.expiration') + 1)->minutes();

    $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
});

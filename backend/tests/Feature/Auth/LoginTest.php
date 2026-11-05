<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

it('logs in and returns a token and the user', function (): void {
    $user = User::factory()->create(['email' => 'a@example.com', 'password' => 'secret-123']);

    $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'secret-123'])
        ->assertOk()
        ->assertJsonStructure(['token', 'data' => ['id', 'name', 'email', 'role']])
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonMissingPath('data.password');

    expect($user->tokens()->count())->toBe(1);
});

it('uses the issued token to access protected routes', function (): void {
    User::factory()->create(['email' => 'a@example.com', 'password' => 'secret-123']);

    $token = $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'secret-123'])
        ->json('token');

    $this->withToken($token)->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonPath('data.email', 'a@example.com');
});

it('rejects wrong credentials with the same message for unknown emails and wrong passwords', function (): void {
    User::factory()->create(['email' => 'a@example.com', 'password' => 'secret-123']);

    $wrongPassword = $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'nope-nope'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $unknownEmail = $this->postJson('/api/auth/login', ['email' => 'x@example.com', 'password' => 'nope-nope'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    expect($wrongPassword->json('errors.email'))->toBe($unknownEmail->json('errors.email'));
});

it('validates the login payload', function (array $payload, string $errorKey): void {
    $this->postJson('/api/auth/login', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);
})->with([
    'missing email' => [['password' => 'x'], 'email'],
    'invalid email' => [['email' => 'nope', 'password' => 'x'], 'email'],
    'missing password' => [['email' => 'a@example.com'], 'password'],
]);

it('throttles repeated failed login attempts', function (): void {
    RateLimiter::clear('a@example.com|127.0.0.1');

    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'wrong-pass'])
            ->assertUnprocessable();
    }

    $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'wrong-pass'])
        ->assertStatus(429);
});

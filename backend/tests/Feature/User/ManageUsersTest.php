<?php

declare(strict_types=1);

use App\Enums\Role;
use App\Jobs\SendEmailConfirmation;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Queue;

function userPayload(array $overrides = []): array
{
    return [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'strong-pass-123',
        ...$overrides,
    ];
}

it('creates an account that still has to confirm its email', function (): void {
    Queue::fake();
    actingAsAdmin();

    $this->postJson('/api/users', userPayload())
        ->assertCreated()
        ->assertJsonPath('data.email', 'jane@example.com')
        ->assertJsonPath('data.role', 'user')
        ->assertJsonPath('data.email_confirmed', false)
        ->assertJsonMissingPath('data.password')
        ->assertJsonMissingPath('data.is_owner');

    $created = User::where('email', 'jane@example.com')->firstOrFail();

    expect($created->password)->not->toBe('strong-pass-123')
        ->and($created->email_verified_at)->toBeNull();
    Queue::assertPushed(SendEmailConfirmation::class, fn (SendEmailConfirmation $job): bool => $job->email === 'jane@example.com');
});

it('keeps the new account out until its email is confirmed', function (): void {
    Queue::fake();
    actingAsAdmin();
    $this->postJson('/api/users', userPayload())->assertCreated();

    $token = null;
    Queue::assertPushed(SendEmailConfirmation::class, function (SendEmailConfirmation $job) use (&$token): bool {
        $token = $job->token;

        return true;
    });

    // The new person is not the administrator: log in as nobody, like a visitor of the login page.
    Auth::forgetGuards();
    Auth::shouldUse('web');

    $this->postJson('/api/auth/login', ['email' => 'jane@example.com', 'password' => 'strong-pass-123'])->assertForbidden()->assertJsonPath('code', 'email_unconfirmed');

    $this->postJson('/api/email-confirmations', ['token' => $token])->assertOk()->assertJsonPath('data.type', 'account');

    $this->postJson('/api/auth/login', ['email' => 'jane@example.com', 'password' => 'strong-pass-123'])->assertOk();
});

it('shows which accounts are still waiting', function (): void {
    actingAsAdmin();
    User::factory()->unverified()->create();

    expect(collect($this->getJson('/api/users')->json('data'))->pluck('email_confirmed')->all())->toContain(false, true);
});

it('sends the link again to an account that is waiting, for the admin only', function (): void {
    Queue::fake();
    $waiting = User::factory()->unverified()->create();
    $confirmed = User::factory()->create();

    actingAsUser();
    $this->postJson("/api/users/{$waiting->id}/confirmation")->assertForbidden();

    actingAsAdmin();
    $this->postJson("/api/users/{$waiting->id}/confirmation")->assertStatus(202);
    Queue::assertPushed(SendEmailConfirmation::class, fn (SendEmailConfirmation $job): bool => $job->email === $waiting->email);

    $this->postJson("/api/users/{$confirmed->id}/confirmation")->assertUnprocessable();
});

it('never makes another administrator', function (): void {
    Queue::fake();
    actingAsAdmin();

    $this->postJson('/api/users', userPayload(['role' => 'admin']))
        ->assertCreated()
        ->assertJsonPath('data.role', 'user');
});

it('creates an account even while new accounts are not allowed', function (): void {
    Queue::fake();
    actingAsAdmin();
    Setting::create(['key' => 'registration', 'value' => ['open' => false]]);

    $this->postJson('/api/users', userPayload())->assertCreated();
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

it('ignores a role sent when updating, nobody becomes administrator', function (): void {
    actingAsAdmin();
    $target = User::factory()->create();

    $this->patchJson("/api/users/{$target->id}", ['role' => 'admin'])
        ->assertOk()
        ->assertJsonPath('data.role', 'user');

    expect($target->fresh()->role)->toBe(Role::User);
});

it('lets an admin delete a regular user and revokes their tokens', function (): void {
    actingAsAdmin();
    $target = User::factory()->create();
    $target->createToken('api');

    $this->deleteJson("/api/users/{$target->id}")->assertNoContent();

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
    $this->assertDatabaseCount('personal_access_tokens', 0);
});

it('does not let the admin delete their own account', function (): void {
    $admin = actingAsAdmin();

    $this->deleteJson("/api/users/{$admin->id}")->assertForbidden();
});

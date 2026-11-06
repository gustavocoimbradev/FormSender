<?php

declare(strict_types=1);

use App\Enums\Role;
use App\Jobs\SendEmailConfirmation;
use App\Models\EmailConfirmation;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

function openRegistration(bool $open = true): void
{
    Setting::updateOrCreate(['key' => 'registration'], ['value' => ['open' => $open]]);
}

function registrationPayload(array $overrides = []): array
{
    return [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'strong-pass-123',
        ...$overrides,
    ];
}

/**
 * Registers an account and returns the confirmation token read from the queued job.
 */
function register(array $overrides = []): string
{
    test()->postJson('/api/auth/register', registrationPayload($overrides))->assertStatus(202);

    $token = null;
    Queue::assertPushed(SendEmailConfirmation::class, function (SendEmailConfirmation $job) use (&$token): bool {
        $token = $job->token;

        return true;
    });

    return (string) $token;
}

beforeEach(function (): void {
    Queue::fake();
});

describe('whether new accounts are allowed', function (): void {
    it('is closed until the administrator opens it', function (): void {
        $this->getJson('/api/setup')->assertJsonPath('data.registration_open', false);

        openRegistration();

        $this->getJson('/api/setup')->assertJsonPath('data.registration_open', true);
    });

    it('refuses new accounts while it is closed', function (): void {
        $this->postJson('/api/auth/register', registrationPayload())->assertForbidden();

        expect(User::count())->toBe(0);
        Queue::assertNothingPushed();
    });

    it('is chosen at setup, closed by default', function (): void {
        $this->postJson('/api/setup', ['email' => 'owner@example.com', 'password' => 'strong-pass-123'])->assertCreated();
        $this->getJson('/api/setup')->assertJsonPath('data.registration_open', false);
    });

    it('can be opened at setup', function (): void {
        $this->postJson('/api/setup', ['email' => 'owner@example.com', 'password' => 'strong-pass-123', 'allow_registration' => true])->assertCreated();
        $this->getJson('/api/setup')->assertJsonPath('data.registration_open', true);
    });

    it('lets the administrator change it later, and nobody else', function (): void {
        $this->postJson('/api/setup', ['email' => 'owner@example.com', 'password' => 'strong-pass-123'])->assertCreated();
        $admin = User::where('email', 'owner@example.com')->firstOrFail();

        $this->actingAs($admin);
        $this->putJson('/api/settings', ['allow_registration' => true])->assertOk()->assertJsonPath('data.allow_registration', true);
        $this->getJson('/api/settings')->assertJsonPath('data.allow_registration', true);

        $this->putJson('/api/settings', ['allow_registration' => false])->assertOk()->assertJsonPath('data.allow_registration', false);

        actingAsUser();
        $this->putJson('/api/settings', ['allow_registration' => true])->assertForbidden();
    });

    it('rejects a value that is not true or false', function (): void {
        actingAsAdmin();

        $this->putJson('/api/settings', ['allow_registration' => 'maybe'])->assertUnprocessable()->assertJsonValidationErrors('allow_registration');
    });
});

describe('creating an account', function (): void {
    beforeEach(fn () => openRegistration());

    it('creates a regular account that still has to confirm its email', function (): void {
        register();

        $user = User::where('email', 'jane@example.com')->firstOrFail();

        expect($user->role)->toBe(Role::User)
            ->and($user->email_verified_at)->toBeNull()
            ->and($user->password)->not->toBe('strong-pass-123');
    });

    it('validates what is sent', function (array $overrides, string $errorKey): void {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/auth/register', registrationPayload($overrides))->assertUnprocessable()->assertJsonValidationErrors($errorKey);
    })->with([
        'missing name' => [['name' => null], 'name'],
        'missing email' => [['email' => null], 'email'],
        'invalid email' => [['email' => 'nope'], 'email'],
        'taken email' => [['email' => 'taken@example.com'], 'email'],
        'short password' => [['password' => 'short'], 'password'],
    ]);

    it('never lets the person choose to be an administrator', function (): void {
        register(['role' => 'admin']);

        expect(User::where('email', 'jane@example.com')->firstOrFail()->role)->toBe(Role::User);
    });

    it('does not let the account in before the email is confirmed', function (): void {
        register();

        $this->postJson('/api/auth/login', ['email' => 'jane@example.com', 'password' => 'strong-pass-123'])
            ->assertForbidden()
            ->assertJsonPath('code', 'email_unconfirmed');
    });
});

describe('confirming the email', function (): void {
    beforeEach(fn () => openRegistration());

    it('confirms the account with the emailed token, once', function (): void {
        $token = register();

        $this->postJson('/api/email-confirmations', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('data.type', 'account')
            ->assertJsonPath('data.email', 'jane@example.com');

        expect(User::where('email', 'jane@example.com')->firstOrFail()->email_verified_at)->not->toBeNull();

        $this->postJson('/api/email-confirmations', ['token' => $token])->assertUnprocessable();
    });

    it('lets a confirmed account log in', function (): void {
        $token = register();
        $this->postJson('/api/email-confirmations', ['token' => $token])->assertOk();

        $this->postJson('/api/auth/login', ['email' => 'jane@example.com', 'password' => 'strong-pass-123'])
            ->assertOk()
            ->assertJsonPath('data.role', 'user');
    });

    it('refuses a wrong token', function (): void {
        register();

        $this->postJson('/api/email-confirmations', ['token' => str_repeat('a', 48)])->assertUnprocessable()->assertJsonValidationErrors('token');
    });

    it('refuses an expired token', function (): void {
        $token = register();
        EmailConfirmation::query()->update(['expires_at' => now()->subMinute()]);

        $this->postJson('/api/email-confirmations', ['token' => $token])->assertUnprocessable();

        expect(User::where('email', 'jane@example.com')->firstOrFail()->email_verified_at)->toBeNull();
    });

    it('never keeps the token itself, only a fingerprint', function (): void {
        $token = register();

        expect(EmailConfirmation::query()->where('token_hash', $token)->exists())->toBeFalse()
            ->and(EmailConfirmation::query()->where('token_hash', hash('sha256', $token))->exists())->toBeTrue();
    });
});

describe('asking for the email again', function (): void {
    beforeEach(fn () => openRegistration());

    it('sends a new link to an account that is still waiting', function (): void {
        register();
        $first = EmailConfirmation::firstOrFail();
        $first->forceFill(['created_at' => now()->subMinutes(5)])->save();
        Queue::fake();

        $this->postJson('/api/auth/resend-confirmation', ['email' => 'jane@example.com'])->assertStatus(202);

        Queue::assertPushed(SendEmailConfirmation::class);
        expect(EmailConfirmation::count())->toBe(1);
    });

    it('answers the same for unknown or already confirmed emails, and sends nothing', function (): void {
        User::factory()->create(['email' => 'done@example.com']);

        $this->postJson('/api/auth/resend-confirmation', ['email' => 'done@example.com'])->assertStatus(202);
        $this->postJson('/api/auth/resend-confirmation', ['email' => 'nobody@example.com'])->assertStatus(202);

        Queue::assertNothingPushed();
    });

    it('waits a minute between emails', function (): void {
        register();
        Queue::fake();

        $this->postJson('/api/auth/resend-confirmation', ['email' => 'jane@example.com'])->assertStatus(202);

        Queue::assertNothingPushed();
    });
});

describe('accounts that already exist', function (): void {
    it('keeps the administrator able to log in right after setup', function (): void {
        $this->postJson('/api/setup', ['email' => 'owner@example.com', 'password' => 'strong-pass-123'])->assertCreated();

        $this->postJson('/api/auth/login', ['email' => 'owner@example.com', 'password' => 'strong-pass-123'])->assertOk();
    });
});

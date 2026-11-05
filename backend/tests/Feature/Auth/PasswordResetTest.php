<?php

declare(strict_types=1);

use App\Jobs\SendPasswordResetCode;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;

/**
 * Requests a code and returns it, read from the queued job.
 */
function requestResetCode(string $email): string
{
    test()->postJson('/api/auth/forgot-password', ['email' => $email])->assertStatus(202);

    $code = null;
    Queue::assertPushed(SendPasswordResetCode::class, function (SendPasswordResetCode $job) use (&$code): bool {
        $code = $job->code;

        return true;
    });

    return (string) $code;
}

beforeEach(function (): void {
    Queue::fake();
});

describe('forgot password', function (): void {
    it('queues a 6 digit code for an existing user', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'jane@example.com'])
            ->assertStatus(202)
            ->assertJsonStructure(['message']);

        Queue::assertPushed(SendPasswordResetCode::class, fn (SendPasswordResetCode $job): bool => $job->email === 'jane@example.com'
            && preg_match('/^\d{6}$/', $job->code) === 1);
    });

    it('stores only a hash of the code, with an expiry', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);

        $code = requestResetCode('jane@example.com');
        $record = PasswordResetCode::where('email', 'jane@example.com')->sole();

        expect($record->code_hash)->not->toBe($code)
            ->and(Hash::check($code, $record->code_hash))->toBeTrue()
            ->and($record->attempts)->toBe(0)
            ->and($record->expires_at->between(now()->addMinutes(14), now()->addMinutes(16)))->toBeTrue();
    });

    it('answers the same way for an unknown email and sends nothing', function (): void {
        $known = User::factory()->create(['email' => 'jane@example.com']);

        $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'ghost@example.com'])->assertStatus(202);
        Queue::assertNothingPushed();

        $known = $this->postJson('/api/auth/forgot-password', ['email' => 'jane@example.com'])->assertStatus(202);

        expect($unknown->json())->toBe($known->json())
            ->and(PasswordResetCode::where('email', 'ghost@example.com')->exists())->toBeFalse();
    });

    it('validates the email', function (?string $email): void {
        $this->postJson('/api/auth/forgot-password', ['email' => $email])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    })->with([[null], ['not-an-email']]);

    it('does not issue a new code during the cool-down', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);

        $first = requestResetCode('jane@example.com');
        $this->postJson('/api/auth/forgot-password', ['email' => 'jane@example.com'])->assertStatus(202);

        Queue::assertPushed(SendPasswordResetCode::class, 1);
        expect(Hash::check($first, PasswordResetCode::sole()->code_hash))->toBeTrue();
    });

    it('replaces the old code once the cool-down is over', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);

        $first = requestResetCode('jane@example.com');
        $this->travel(61)->seconds();
        $this->postJson('/api/auth/forgot-password', ['email' => 'jane@example.com'])->assertStatus(202);

        Queue::assertPushed(SendPasswordResetCode::class, 2);
        expect(PasswordResetCode::count())->toBe(1)
            ->and(Hash::check($first, PasswordResetCode::sole()->code_hash))->toBeFalse();
    });

    it('is throttled', function (): void {
        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/auth/forgot-password', ['email' => 'jane@example.com'])->assertStatus(202);
        }

        $this->postJson('/api/auth/forgot-password', ['email' => 'jane@example.com'])->assertStatus(429);
    });
});

describe('reset password', function (): void {
    it('changes the password with a valid code, revokes tokens and burns the code', function (): void {
        $user = User::factory()->create(['email' => 'jane@example.com', 'password' => 'old-password-1']);
        $user->createToken('api');
        $code = requestResetCode('jane@example.com');

        $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => $code, 'password' => 'new-password-1'])
            ->assertOk()
            ->assertJsonStructure(['message']);

        expect(Hash::check('new-password-1', $user->fresh()->password))->toBeTrue()
            ->and($user->tokens()->count())->toBe(0)
            ->and(PasswordResetCode::count())->toBe(0);

        $this->postJson('/api/auth/login', ['email' => 'jane@example.com', 'password' => 'new-password-1'])->assertOk();
    });

    it('cannot reuse a code', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);
        $code = requestResetCode('jane@example.com');
        $payload = ['email' => 'jane@example.com', 'code' => $code, 'password' => 'new-password-1'];

        $this->postJson('/api/auth/reset-password', $payload)->assertOk();
        $this->postJson('/api/auth/reset-password', $payload)->assertUnprocessable()->assertJsonValidationErrors('code');
    });

    it('rejects a wrong code, counting the attempt', function (): void {
        $user = User::factory()->create(['email' => 'jane@example.com', 'password' => 'old-password-1']);
        requestResetCode('jane@example.com');

        $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => '000000', 'password' => 'new-password-1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');

        expect(PasswordResetCode::sole()->attempts)->toBe(1)
            ->and(Hash::check('old-password-1', $user->fresh()->password))->toBeTrue();
    });

    it('gives the same error for an unknown email and a wrong code', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);
        requestResetCode('jane@example.com');

        $wrongCode = $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => '000000', 'password' => 'new-password-1'])
            ->assertUnprocessable();
        $unknown = $this->postJson('/api/auth/reset-password', ['email' => 'ghost@example.com', 'code' => '000000', 'password' => 'new-password-1'])
            ->assertUnprocessable();

        expect($wrongCode->json('errors'))->toBe($unknown->json('errors'));
    });

    it('rejects an expired code', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);
        $code = requestResetCode('jane@example.com');

        $this->travel(16)->minutes();

        $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => $code, 'password' => 'new-password-1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    });

    it('locks the code after 5 wrong attempts, even for the right code', function (): void {
        User::factory()->create(['email' => 'jane@example.com']);
        $code = requestResetCode('jane@example.com');
        $wrong = $code === '000000' ? '111111' : '000000';

        // The reset route is throttled to 5/min, so spread the attempts over time.
        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => $wrong, 'password' => 'new-password-1'])
                ->assertUnprocessable();
            $this->travel(61)->seconds();
        }

        $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => $code, 'password' => 'new-password-1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    });

    it('validates the payload', function (array $overrides, string $errorKey): void {
        $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => '123456', 'password' => 'new-password-1', ...$overrides])
            ->assertUnprocessable()
            ->assertJsonValidationErrors($errorKey);
    })->with([
        'missing email' => [['email' => null], 'email'],
        'missing code' => [['code' => null], 'code'],
        'code not 6 digits' => [['code' => '12ab56'], 'code'],
        'short code' => [['code' => '123'], 'code'],
        'missing password' => [['password' => null], 'password'],
        'short password' => [['password' => 'short'], 'password'],
    ]);

    it('is throttled', function (): void {
        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => '123456', 'password' => 'new-password-1'])
                ->assertUnprocessable();
        }

        $this->postJson('/api/auth/reset-password', ['email' => 'jane@example.com', 'code' => '123456', 'password' => 'new-password-1'])
            ->assertStatus(429);
    });
});

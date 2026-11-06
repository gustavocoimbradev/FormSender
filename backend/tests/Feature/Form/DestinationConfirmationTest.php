<?php

declare(strict_types=1);

use App\Jobs\SendEmailConfirmation;
use App\Jobs\SendFormSubmission;
use App\Models\EmailConfirmation;
use App\Models\Form;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

/**
 * The tokens of the confirmation emails queued so far, by the address they were sent to.
 *
 * @return array<string, string>
 */
function confirmationTokens(): array
{
    $tokens = [];

    Queue::assertPushed(SendEmailConfirmation::class, function (SendEmailConfirmation $job) use (&$tokens): bool {
        $tokens[$job->email] = $job->token;

        return true;
    });

    return $tokens;
}

beforeEach(function (): void {
    Queue::fake();
});

describe('a regular account', function (): void {
    it('asks each new destination to confirm, except its own address', function (): void {
        $user = actingAsUser();

        $this->postJson('/api/forms', ['name' => 'Mine', 'destinations' => [$user->email, 'team@example.com', 'boss@example.com']])
            ->assertCreated()
            ->assertJsonPath('data.destinations', [$user->email, 'team@example.com', 'boss@example.com'])
            ->assertJsonPath('data.confirmed_destinations', [$user->email]);

        expect(array_keys(confirmationTokens()))->toEqualCanonicalizing(['team@example.com', 'boss@example.com']);
    });

    it('counts its own address as confirmed whatever the letter case', function (): void {
        $user = actingAsUser();

        $this->postJson('/api/forms', ['name' => 'Mine', 'destinations' => [strtoupper($user->email)]])
            ->assertCreated()
            ->assertJsonPath('data.confirmed_destinations', [strtoupper($user->email)]);

        Queue::assertNothingPushed();
    });

    it('confirms a destination with the link that was emailed', function (): void {
        actingAsUser();
        $code = $this->postJson('/api/forms', ['name' => 'Mine', 'destinations' => ['team@example.com']])->json('data.code');
        $token = confirmationTokens()['team@example.com'];

        $this->postJson('/api/email-confirmations', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('data.type', 'destination')
            ->assertJsonPath('data.email', 'team@example.com')
            ->assertJsonPath('data.form', 'Mine');

        expect(Form::where('code', $code)->firstOrFail()->confirmed_destinations)->toBe(['team@example.com']);

        $this->postJson('/api/email-confirmations', ['token' => $token])->assertUnprocessable();
    });

    it('delivers only to the confirmed destinations', function (): void {
        configureSmtp();
        $user = User::factory()->create();
        $form = contactForm(['user_id' => $user->id, 'destinations' => ['ok@example.com', 'waiting@example.com'], 'confirmed_destinations' => ['ok@example.com']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(202);

        $submission = $form->submissions()->firstOrFail();

        expect($submission->destinations)->toBe(['ok@example.com'])
            ->and(collect($submission->deliveries)->pluck('destination')->all())->toBe(['ok@example.com']);
        Queue::assertPushed(SendFormSubmission::class);
    });

    it('does not accept messages while no destination is confirmed', function (): void {
        configureSmtp();
        $user = User::factory()->create();
        $form = contactForm(['user_id' => $user->id, 'destinations' => ['waiting@example.com']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertUnprocessable();

        Queue::assertNotPushed(SendFormSubmission::class);
    });

    it('asks only about the destinations that are new when the form changes, and forgets the removed ones', function (): void {
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create(['destinations' => ['old@example.com', 'gone@example.com'], 'confirmed_destinations' => ['old@example.com', 'gone@example.com']]);

        $this->putJson("/api/forms/{$form->code}", ['name' => 'Same', 'destinations' => ['old@example.com', 'new@example.com']])->assertOk();

        expect(array_keys(confirmationTokens()))->toBe(['new@example.com'])
            ->and($form->fresh()->confirmed_destinations)->toBe(['old@example.com']);
    });

    it('does not ask again when something else about the form changes', function (): void {
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create(['destinations' => ['wait@example.com']]);

        $this->patchJson("/api/forms/{$form->code}", ['name' => 'Renamed'])->assertOk();

        Queue::assertNothingPushed();
    });
});

describe('the administrator', function (): void {
    it('needs no confirmation: every destination is ready', function (): void {
        actingAsAdmin();

        $this->postJson('/api/forms', ['name' => 'Mine', 'destinations' => ['team@example.com']])
            ->assertCreated()
            ->assertJsonPath('data.confirmed_destinations', ['team@example.com']);

        Queue::assertNothingPushed();
    });

    it('delivers a form without an owner to every destination', function (): void {
        configureSmtp();
        $form = contactForm(['destinations' => ['a@example.com', 'b@example.com']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(202);

        expect($form->submissions()->firstOrFail()->destinations)->toBe(['a@example.com', 'b@example.com']);
    });
});

describe('asking again', function (): void {
    it('sends a new link for a destination that is still waiting', function (): void {
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create(['destinations' => ['wait@example.com']]);

        $this->postJson("/api/forms/{$form->code}/destinations/confirmation", ['email' => 'wait@example.com'])->assertStatus(202);

        expect(confirmationTokens())->toHaveKey('wait@example.com');
    });

    it('waits a minute between emails to the same address', function (): void {
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create(['destinations' => ['wait@example.com']]);
        $this->postJson("/api/forms/{$form->code}/destinations/confirmation", ['email' => 'wait@example.com'])->assertStatus(202);
        Queue::fake();

        $this->postJson("/api/forms/{$form->code}/destinations/confirmation", ['email' => 'wait@example.com'])->assertStatus(429);

        Queue::assertNothingPushed();
    });

    it('refuses an address that is not waiting', function (string $email): void {
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create(['destinations' => ['wait@example.com', 'ready@example.com'], 'confirmed_destinations' => ['ready@example.com']]);

        $this->postJson("/api/forms/{$form->code}/destinations/confirmation", ['email' => $email])->assertUnprocessable();
    })->with(['already confirmed' => 'ready@example.com', 'not a destination' => 'stranger@example.com']);

    it('is only for the owner of the form', function (): void {
        actingAsUser();
        $form = Form::factory()->for(User::factory()->create())->create(['destinations' => ['wait@example.com']]);

        $this->postJson("/api/forms/{$form->code}/destinations/confirmation", ['email' => 'wait@example.com'])->assertForbidden();
    });

    it('stops the old link when a new one is sent', function (): void {
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create(['destinations' => ['wait@example.com']]);
        $this->postJson("/api/forms/{$form->code}/destinations/confirmation", ['email' => 'wait@example.com'])->assertStatus(202);

        expect(EmailConfirmation::where('form_id', $form->id)->count())->toBe(1);
    });
});

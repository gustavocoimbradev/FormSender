<?php

declare(strict_types=1);

use App\Jobs\SendFormSubmission;
use App\Models\FormSubmission;
use App\Models\Setting;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    Queue::fake();
    configureSmtp();
});

it('requires a logged in user', function (): void {
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/test", validSubmission())->assertUnauthorized();

    expect(FormSubmission::count())->toBe(0);
});

it('sends a test message through the form, saved and queued like a real one', function (): void {
    actingAsUser();
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/test", validSubmission(['message' => 'Hello']))
        ->assertStatus(202)
        ->assertJsonPath('data.status', 'pending');

    $submission = FormSubmission::sole();

    expect($submission->form_id)->toBe($form->id)
        ->and($submission->data)->toBe(['name' => 'Jane', 'email' => 'jane@example.com', 'message' => 'Hello'])
        ->and($submission->origin)->toBe('dashboard')
        ->and($submission->deliveries)->toHaveCount(2);

    Queue::assertPushed(SendFormSubmission::class, fn ($job) => $job->submission->is($submission));
});

it('works for a regular user as well as an admin', function (string $role): void {
    $role === 'admin' ? actingAsAdmin() : actingAsUser();
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/test", validSubmission())->assertStatus(202);
})->with(['user', 'admin']);

it('does not depend on the allowed sites, since it is an action of the panel', function (): void {
    actingAsUser();
    $form = contactForm(['allowed_domains' => ['example.com']]);

    $this->postJson("/api/forms/{$form->code}/test", validSubmission())->assertStatus(202);
});

it('validates like a real submission and drops unknown fields', function (): void {
    actingAsUser();
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/test", ['name' => 'Jane'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->postJson("/api/forms/{$form->code}/test", validSubmission(['is_admin' => true]))->assertStatus(202);

    expect(FormSubmission::sole()->data)->toBe(['name' => 'Jane', 'email' => 'jane@example.com']);
});

it('refuses when the form has no destinations or the email is not configured', function (): void {
    actingAsUser();

    $noDestinations = contactForm(['destinations' => []]);
    $this->postJson("/api/forms/{$noDestinations->code}/test", validSubmission())->assertUnprocessable();

    Setting::where('key', 'smtp')->delete();
    $form = contactForm();
    $this->postJson("/api/forms/{$form->code}/test", validSubmission())->assertStatus(503);

    Queue::assertNothingPushed();
});

it('is addressed by the code, never the numeric id', function (): void {
    actingAsUser();
    $form = contactForm();

    $this->postJson('/api/forms/'.$form->id.'/test', validSubmission())->assertNotFound();
});

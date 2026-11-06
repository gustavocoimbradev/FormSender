<?php

declare(strict_types=1);

use App\Models\Form;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

/**
 * The form every new account starts with.
 */
function expectContactForm(User $owner): void
{
    $forms = Form::where('user_id', $owner->id)->get();

    expect($forms)->toHaveCount(1);

    $form = $forms->first();

    expect($form->name)->toBe('Contact')
        ->and($form->fields)->toBe([
            ['name' => 'email', 'label' => 'Your email', 'type' => 'email', 'required' => true],
            ['name' => 'name', 'label' => 'Your name', 'type' => 'text', 'required' => true],
            ['name' => 'message', 'label' => 'Message', 'type' => 'textarea', 'required' => false],
        ])
        ->and($form->destinations)->toBe([$owner->email])
        ->and($form->confirmedDestinations())->toBe([$owner->email])
        ->and($form->allowed_domains)->toBe([]);
}

beforeEach(function (): void {
    Queue::fake();
});

it('gives the administrator a Contact form when the setup creates the account', function (): void {
    $this->postJson('/api/setup', ['email' => 'owner@example.com', 'password' => 'strong-pass-123'])->assertCreated();

    expectContactForm(User::where('email', 'owner@example.com')->firstOrFail());
});

it('gives a Contact form to every account that signs up', function (): void {
    Setting::create(['key' => 'registration', 'value' => ['open' => true]]);

    $this->postJson('/api/auth/register', ['name' => 'Jane', 'email' => 'jane@example.com', 'password' => 'strong-pass-123'])->assertStatus(202);

    expectContactForm(User::where('email', 'jane@example.com')->firstOrFail());
});

it('gives a Contact form to an account the administrator creates', function (): void {
    actingAsAdmin();

    $this->postJson('/api/users', ['name' => 'Jane', 'email' => 'jane@example.com', 'password' => 'strong-pass-123'])->assertCreated();

    expectContactForm(User::where('email', 'jane@example.com')->firstOrFail());
});

it('gives a Contact form to an account made from the command line', function (): void {
    $this->artisan('user:create', ['email' => 'cli@example.com', '--name' => 'Cli', '--role' => 'user', '--password' => 'strong-pass-123'])->assertSuccessful();

    expectContactForm(User::where('email', 'cli@example.com')->firstOrFail());
});

it('lets an account made from the command line log in, the one who runs it vouches for it', function (): void {
    $this->artisan('user:create', ['email' => 'cli@example.com', '--name' => 'Cli', '--role' => 'admin', '--password' => 'strong-pass-123'])->assertSuccessful();

    $this->postJson('/api/auth/login', ['email' => 'cli@example.com', 'password' => 'strong-pass-123'])->assertOk();
});

it('is a form like any other: it counts for the limit of forms and can receive a message', function (): void {
    configureSmtp();
    Setting::create(['key' => 'registration', 'value' => ['open' => true]]);
    Setting::create(['key' => 'quotas', 'value' => ['max_forms' => 1, 'max_daily_submissions' => null]]);
    $this->postJson('/api/auth/register', ['name' => 'Jane', 'email' => 'jane@example.com', 'password' => 'strong-pass-123'])->assertStatus(202);
    $owner = User::where('email', 'jane@example.com')->firstOrFail();
    $form = Form::where('user_id', $owner->id)->firstOrFail();

    $this->postJson("/api/forms/{$form->code}/submit", ['email' => 'visitor@example.com', 'name' => 'Visitor'])->assertStatus(202);
    $this->actingAs($owner, 'sanctum')->postJson('/api/forms', ['name' => 'Another'])->assertForbidden();
});

it('does not create a second one when the account is created again by the same flow twice', function (): void {
    actingAsAdmin();
    $payload = ['name' => 'Jane', 'email' => 'jane@example.com', 'password' => 'strong-pass-123'];

    $this->postJson('/api/users', $payload)->assertCreated();
    $this->postJson('/api/users', $payload)->assertUnprocessable();

    expect(Form::count())->toBe(1);
});

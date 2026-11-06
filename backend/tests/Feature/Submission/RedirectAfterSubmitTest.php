<?php

declare(strict_types=1);

use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    Queue::fake();
    configureSmtp();
});

const BROWSER_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

function redirectingForm(array $overrides = []): Form
{
    return contactForm(['response_type' => 'redirect', 'redirect_url' => 'https://site.test/thanks', ...$overrides]);
}

it('sends a plain browser form post straight to the thank-you page', function (): void {
    $form = redirectingForm();

    $this->post("/api/forms/{$form->code}/submit", validSubmission(), ['Accept' => BROWSER_ACCEPT])
        ->assertStatus(303)
        ->assertRedirect('https://site.test/thanks');

    expect(FormSubmission::count())->toBe(1);
});

it('redirects any post that does not ask for json, a fetch call included', function (): void {
    $form = redirectingForm();

    $this->post("/api/forms/{$form->code}/submit", validSubmission(), ['Accept' => '*/*'])
        ->assertStatus(303)
        ->assertRedirect('https://site.test/thanks');
});

it('still answers json to a script that asks for json, even when the form redirects', function (): void {
    $form = redirectingForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())
        ->assertStatus(202)
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.redirect_url', 'https://site.test/thanks');
});

it('answers json with the thank-you page address when the form is set to json', function (): void {
    $form = contactForm(['response_type' => 'json', 'redirect_url' => 'https://site.test/thanks']);

    $this->post("/api/forms/{$form->code}/submit", validSubmission(), ['Accept' => BROWSER_ACCEPT])
        ->assertStatus(202)
        ->assertJsonPath('data.redirect_url', 'https://site.test/thanks');
});

it('answers json without an address when the form has no thank-you page', function (): void {
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())
        ->assertStatus(202)
        ->assertJsonPath('data.redirect_url', null);
});

it('answers json when the form is set to redirect but has no address saved', function (): void {
    $form = contactForm(['response_type' => 'redirect', 'redirect_url' => null]);

    $this->post("/api/forms/{$form->code}/submit", validSubmission(), ['Accept' => BROWSER_ACCEPT])
        ->assertStatus(202);
});

it('treats a bot the same way, so it never learns it was caught', function (): void {
    $form = redirectingForm();

    $this->post("/api/forms/{$form->code}/submit", validSubmission(['_gotcha' => 'spam']), ['Accept' => BROWSER_ACCEPT])
        ->assertStatus(303)
        ->assertRedirect('https://site.test/thanks');

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission(['_gotcha' => 'spam']))
        ->assertStatus(202)
        ->assertJsonPath('data.redirect_url', 'https://site.test/thanks');

    expect(FormSubmission::pluck('status')->map->value->unique()->all())->toBe(['spam']);
});

it('does not redirect when the submission is invalid', function (): void {
    $form = redirectingForm();

    $this->post("/api/forms/{$form->code}/submit", ['name' => 'Jane'], ['Accept' => BROWSER_ACCEPT])
        ->assertUnprocessable();
});

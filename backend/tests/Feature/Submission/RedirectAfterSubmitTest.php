<?php

declare(strict_types=1);

use App\Models\FormSubmission;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    Queue::fake();
    configureSmtp();
});

const BROWSER_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

it('redirects a plain browser form post to the form redirect address', function (): void {
    $form = contactForm(['redirect_url' => 'https://site.test/thanks']);

    $this->post("/api/forms/{$form->code}/submit", validSubmission(), ['Accept' => BROWSER_ACCEPT])
        ->assertStatus(303)
        ->assertRedirect('https://site.test/thanks');

    expect(FormSubmission::count())->toBe(1);
});

it('keeps answering json to a script that asks for json', function (): void {
    $form = contactForm(['redirect_url' => 'https://site.test/thanks']);

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())
        ->assertStatus(202)
        ->assertJsonPath('data.status', 'pending');
});

it('keeps answering json to a fetch call that accepts anything', function (): void {
    $form = contactForm(['redirect_url' => 'https://site.test/thanks']);

    $this->post("/api/forms/{$form->code}/submit", validSubmission(), ['Accept' => '*/*'])
        ->assertStatus(202);
});

it('answers json to a browser post when the form has no redirect address', function (): void {
    $form = contactForm();

    $this->post("/api/forms/{$form->code}/submit", validSubmission(), ['Accept' => BROWSER_ACCEPT])
        ->assertStatus(202);
});

it('redirects a bot the same way, so it never learns it was caught', function (): void {
    $form = contactForm(['redirect_url' => 'https://site.test/thanks']);

    $this->post("/api/forms/{$form->code}/submit", validSubmission(['_gotcha' => 'spam']), ['Accept' => BROWSER_ACCEPT])
        ->assertStatus(303)
        ->assertRedirect('https://site.test/thanks');

    expect(FormSubmission::sole()->status->value)->toBe('spam');
});

it('does not redirect when the submission is invalid', function (): void {
    $form = contactForm(['redirect_url' => 'https://site.test/thanks']);

    $this->post("/api/forms/{$form->code}/submit", ['name' => 'Jane'], ['Accept' => BROWSER_ACCEPT])
        ->assertUnprocessable();
});

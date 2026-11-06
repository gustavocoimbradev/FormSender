<?php

declare(strict_types=1);

beforeEach(fn () => actingAsUser());

it('answers json by default', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact'])
        ->assertCreated()
        ->assertJsonPath('data.response_type', 'json')
        ->assertJsonPath('data.redirect_url', null);
});

it('saves the answer type and the thank-you page when creating a form', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'response_type' => 'redirect', 'redirect_url' => 'https://site.test/thanks'])
        ->assertCreated()
        ->assertJsonPath('data.response_type', 'redirect')
        ->assertJsonPath('data.redirect_url', 'https://site.test/thanks');
});

it('keeps a thank-you page even when the form answers json', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'response_type' => 'json', 'redirect_url' => 'https://site.test/thanks'])
        ->assertCreated()
        ->assertJsonPath('data.redirect_url', 'https://site.test/thanks');
});

it('requires the thank-you page when the form redirects', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'response_type' => 'redirect'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('redirect_url');
});

it('rejects an answer type that does not exist', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'response_type' => 'html'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('response_type');
});

it('clears the thank-you page with null', function (): void {
    $form = contactForm(['redirect_url' => 'https://site.test/thanks']);

    $this->patchJson("/api/forms/{$form->code}", ['redirect_url' => null])
        ->assertOk()
        ->assertJsonPath('data.redirect_url', null);
});

it('switches back to json without touching the thank-you page', function (): void {
    $form = contactForm(['response_type' => 'redirect', 'redirect_url' => 'https://site.test/thanks']);

    $this->patchJson("/api/forms/{$form->code}", ['response_type' => 'json'])
        ->assertOk()
        ->assertJsonPath('data.response_type', 'json')
        ->assertJsonPath('data.redirect_url', 'https://site.test/thanks');
});

it('rejects a thank-you page that is not an http or https url', function (string $value): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'redirect_url' => $value])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('redirect_url');
})->with(['javascript:alert(1)', 'not a url', 'ftp://site.test/thanks', '//site.test/thanks']);

it('accepts a file field when creating a form', function (): void {
    $this->postJson('/api/forms', [
        'name' => 'Quote',
        'fields' => [['name' => 'brief', 'label' => 'Brief', 'type' => 'file']],
    ])
        ->assertCreated()
        ->assertJsonPath('data.fields.0.type', 'file');
});

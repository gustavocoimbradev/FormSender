<?php

declare(strict_types=1);

beforeEach(fn () => actingAsUser());

it('saves a redirect address when creating a form', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'redirect_url' => 'https://site.test/thanks'])
        ->assertCreated()
        ->assertJsonPath('data.redirect_url', 'https://site.test/thanks');
});

it('has no redirect address by default', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact'])
        ->assertCreated()
        ->assertJsonPath('data.redirect_url', null);
});

it('clears the redirect address with null', function (): void {
    $form = contactForm(['redirect_url' => 'https://site.test/thanks']);

    $this->patchJson("/api/forms/{$form->code}", ['redirect_url' => null])
        ->assertOk()
        ->assertJsonPath('data.redirect_url', null);
});

it('rejects a redirect address that is not an http or https url', function (string $value): void {
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

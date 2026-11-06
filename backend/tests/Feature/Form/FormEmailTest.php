<?php

declare(strict_types=1);

use App\Support\DefaultEmailTemplate;

beforeEach(fn () => actingAsAdmin());

it('starts with the default email', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact'])
        ->assertCreated()
        ->assertJsonPath('data.email_subject', DefaultEmailTemplate::SUBJECT)
        ->assertJsonPath('data.email_html', DefaultEmailTemplate::HTML)
        ->assertJsonPath('data.email_is_default', true);
});

it('saves an email written for the form', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'email_subject' => 'Hi {{form_name}}', 'email_html' => '<p>{{fields}}</p>'])
        ->assertCreated()
        ->assertJsonPath('data.email_subject', 'Hi {{form_name}}')
        ->assertJsonPath('data.email_html', '<p>{{fields}}</p>')
        ->assertJsonPath('data.email_is_default', false);

    $this->assertDatabaseHas('forms', ['name' => 'Contact', 'email_subject' => 'Hi {{form_name}}']);
});

it('changes only the subject and keeps the default body', function (): void {
    $form = contactForm();

    $this->patchJson("/api/forms/{$form->code}", ['email_subject' => 'Only the subject'])
        ->assertOk()
        ->assertJsonPath('data.email_subject', 'Only the subject')
        ->assertJsonPath('data.email_html', DefaultEmailTemplate::HTML)
        ->assertJsonPath('data.email_is_default', false);
});

it('goes back to the default email with null', function (): void {
    $form = contactForm(['email_subject' => 'Custom', 'email_html' => '<p>Custom</p>']);

    $this->patchJson("/api/forms/{$form->code}", ['email_subject' => null, 'email_html' => null])
        ->assertOk()
        ->assertJsonPath('data.email_subject', DefaultEmailTemplate::SUBJECT)
        ->assertJsonPath('data.email_is_default', true);

    expect($form->fresh()->email_html)->toBeNull();
});

it('stores nothing when the text is the default one, so the default can improve later', function (): void {
    $form = contactForm();

    $this->patchJson("/api/forms/{$form->code}", ['email_subject' => DefaultEmailTemplate::SUBJECT, 'email_html' => DefaultEmailTemplate::HTML])
        ->assertOk()
        ->assertJsonPath('data.email_is_default', true);

    expect($form->fresh()->email_subject)->toBeNull()->and($form->fresh()->email_html)->toBeNull();
});

it('validates the email', function (array $payload, string $errorKey): void {
    $this->postJson('/api/forms', ['name' => 'Contact', ...$payload])
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);
})->with([
    'script in the body' => [['email_html' => '<p>x</p><script>alert(1)</script>'], 'email_html'],
    'body too long' => [['email_html' => str_repeat('a', 100001)], 'email_html'],
    'subject too long' => [['email_subject' => str_repeat('a', 201)], 'email_subject'],
    'body is not text' => [['email_html' => ['x']], 'email_html'],
]);

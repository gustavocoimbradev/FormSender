<?php

declare(strict_types=1);

use App\Support\DefaultEmailTemplate;

describe('preview', function (): void {
    beforeEach(fn () => actingAsUser());

    it('renders the given subject and html with sample data, without saving anything', function (): void {
        $this->postJson('/api/email/preview', ['subject' => 'Hi {{form_name}}', 'html' => '<h1>{{form_name}}</h1>{{fields}}'])
            ->assertOk()
            ->assertJsonPath('data.subject', 'Hi Contact form')
            ->assertJsonPath('data.html', fn (string $html): bool => str_contains($html, '<h1>Contact form</h1>') && str_contains($html, 'Maria Souza'));
    });

    it('uses the fields of the form being edited', function (): void {
        $this->postJson('/api/email/preview', [
            'subject' => 'x',
            'html' => '{{fields}}',
            'fields' => [['name' => 'company', 'label' => 'Company', 'type' => 'text'], ['name' => 'brief', 'label' => 'Brief', 'type' => 'file']],
        ])
            ->assertOk()
            ->assertJsonPath('data.html', fn (string $html): bool => str_contains($html, 'Company') && str_contains($html, 'document.pdf') && ! str_contains($html, 'Maria Souza'));
    });

    it('validates what it is given', function (): void {
        $this->postJson('/api/email/preview', ['subject' => 'x'])->assertUnprocessable()->assertJsonValidationErrors('html');
        $this->postJson('/api/email/preview', ['subject' => 'x', 'html' => '<script>1</script>'])->assertUnprocessable()->assertJsonValidationErrors('html');
    });
});

describe('default email', function (): void {
    it('gives the email every form starts with', function (): void {
        actingAsUser();

        $this->getJson('/api/email/default')
            ->assertOk()
            ->assertJsonPath('data.subject', DefaultEmailTemplate::SUBJECT)
            ->assertJsonPath('data.html', DefaultEmailTemplate::HTML);
    });
});

it('requires a logged in user', function (): void {
    $this->postJson('/api/email/preview', ['subject' => 'x', 'html' => '<p>x</p>'])->assertUnauthorized();
    $this->getJson('/api/email/default')->assertUnauthorized();
});

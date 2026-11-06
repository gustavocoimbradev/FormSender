<?php

declare(strict_types=1);

use App\Support\DefaultFormStrings;

beforeEach(fn () => actingAsAdmin());

it('starts with the default texts', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact'])
        ->assertCreated()
        ->assertJsonPath('data.strings.send', 'Send')
        ->assertJsonPath('data.strings.sent', 'Message sent!')
        ->assertJsonPath('data.strings_are_default', true)
        ->assertJsonCount(count(DefaultFormStrings::texts()), 'data.strings');
});

it('saves the texts changed for the form and keeps the others default', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'strings' => ['send' => 'Enviar', 'sent' => 'Mensagem enviada!']])
        ->assertCreated()
        ->assertJsonPath('data.strings.send', 'Enviar')
        ->assertJsonPath('data.strings.sent', 'Mensagem enviada!')
        ->assertJsonPath('data.strings.sending', 'Sending')
        ->assertJsonPath('data.strings_are_default', false);
});

it('stores only what differs from the default, so the defaults can improve later', function (): void {
    $form = contactForm();

    $this->patchJson("/api/forms/{$form->code}", ['strings' => ['send' => 'Send', 'sent' => 'Enviado', 'sending' => '  ']])
        ->assertOk();

    expect($form->fresh()->strings)->toBe(['sent' => 'Enviado']);
});

it('goes back to the default texts with null or an empty list', function (): void {
    $form = contactForm(['strings' => ['send' => 'Enviar']]);

    $this->patchJson("/api/forms/{$form->code}", ['strings' => null])
        ->assertOk()
        ->assertJsonPath('data.strings.send', 'Send')
        ->assertJsonPath('data.strings_are_default', true);

    expect($form->fresh()->strings)->toBeNull();
});

it('treats an empty text as the default one', function (): void {
    $form = contactForm(['strings' => ['send' => 'Enviar']]);

    $this->patchJson("/api/forms/{$form->code}", ['strings' => ['send' => null]])
        ->assertOk()
        ->assertJsonPath('data.strings.send', 'Send');
});

it('validates the texts', function (array $strings, string $errorKey): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'strings' => $strings])
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);
})->with([
    'a text that does not exist' => [['nope' => 'x'], 'strings'],
    'a text that is too long' => [['send' => str_repeat('a', 201)], 'strings.send'],
    'a text that is not text' => [['send' => ['x']], 'strings.send'],
]);

it('lists the texts that can be changed, with what each is for', function (): void {
    $response = $this->getJson('/api/strings/default')->assertOk();

    expect($response->json('data'))->toHaveCount(count(DefaultFormStrings::texts()))
        ->and($response->json('data.0'))->toHaveKeys(['key', 'description', 'text'])
        ->and(collect($response->json('data'))->pluck('key')->all())->toBe(array_keys(DefaultFormStrings::texts()));
});

it('has a plain-language description for every text', function (): void {
    expect(array_keys(DefaultFormStrings::descriptions()))->toBe(array_keys(DefaultFormStrings::texts()));

    foreach (DefaultFormStrings::descriptions() as $key => $description) {
        expect($description)->not->toBe('', "text {$key} has no description");
    }
});

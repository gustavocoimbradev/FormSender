<?php

declare(strict_types=1);

use App\Support\DefaultFormStyle;

beforeEach(fn () => actingAsUser());

it('starts with the default style', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact'])
        ->assertCreated()
        ->assertJsonPath('data.css', DefaultFormStyle::CSS)
        ->assertJsonPath('data.css_is_default', true);
});

it('saves a style written for the form', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'css' => '#formsender-form { --accent: #ff0000; }'])
        ->assertCreated()
        ->assertJsonPath('data.css', '#formsender-form { --accent: #ff0000; }')
        ->assertJsonPath('data.css_is_default', false);

    $this->assertDatabaseHas('forms', ['name' => 'Contact', 'css' => '#formsender-form { --accent: #ff0000; }']);
});

it('goes back to the default style with null', function (): void {
    $form = contactForm(['css' => 'button { color: red; }']);

    $this->patchJson("/api/forms/{$form->code}", ['css' => null])
        ->assertOk()
        ->assertJsonPath('data.css', DefaultFormStyle::CSS)
        ->assertJsonPath('data.css_is_default', true);

    expect($form->fresh()->css)->toBeNull();
});

it('stores nothing when the text is the default one, so the default can improve later', function (): void {
    $form = contactForm();

    $this->patchJson("/api/forms/{$form->code}", ['css' => DefaultFormStyle::CSS."\n"])
        ->assertOk()
        ->assertJsonPath('data.css_is_default', true);

    expect($form->fresh()->css)->toBeNull();
});

it('also recognizes the default style written with windows line breaks', function (): void {
    $form = contactForm();

    $this->patchJson("/api/forms/{$form->code}", ['css' => str_replace("\n", "\r\n", DefaultFormStyle::CSS)])
        ->assertOk()
        ->assertJsonPath('data.css_is_default', true);
});

it('validates the style', function (string $css): void {
    $this->postJson('/api/forms', ['name' => 'Contact', 'css' => $css])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('css');
})->with([
    'an import of another stylesheet' => ['@import url("https://evil.test/x.css");'],
    'a closing style tag' => ['a{} </style><script>alert(1)</script>'],
    'too long' => [str_repeat('a', 50001)],
]);

it('gives the default style to anyone logged in, to go back to it', function (): void {
    $this->getJson('/api/style/default')
        ->assertOk()
        ->assertJsonPath('data.css', DefaultFormStyle::CSS);
});

it('has a default style that covers what the form draws', function (): void {
    expect(DefaultFormStyle::CSS)
        ->toContain('#formsender-form')->not->toContain('.dark')->toContain('.field')->toContain('.error')
        ->toContain('.notice')->toContain('button')->toContain('prefers-reduced-motion')
        ->not->toContain('@import')->not->toContain('</style');

    // Every rule lives inside the one element with the specific id (the animations apart): nothing can reach another page.
    $outside = preg_replace('/@keyframes\s+\w+\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/', '', DefaultFormStyle::CSS);
    preg_match_all('/^[^\s}\/][^\n]*\{$/m', (string) $outside, $topLevel);
    expect($topLevel[0])->toBe(['#formsender-form {']);
});

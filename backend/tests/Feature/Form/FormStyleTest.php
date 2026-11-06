<?php

declare(strict_types=1);

use App\Support\DefaultFormStyle;

beforeEach(fn () => actingAsAdmin());

it('starts with the default style, made for that form', function (): void {
    $response = $this->postJson('/api/forms', ['name' => 'Contact'])
        ->assertCreated()
        ->assertJsonPath('data.css_is_default', true);

    expect($response->json('data.css'))->toBe(DefaultFormStyle::for($response->json('data.code')));
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
        ->assertJsonPath('data.css', DefaultFormStyle::for($form->code))
        ->assertJsonPath('data.css_is_default', true);

    expect($form->fresh()->css)->toBeNull();
});

it('stores nothing when the text is the default one, so the default can improve later', function (): void {
    $form = contactForm();

    $this->patchJson("/api/forms/{$form->code}", ['css' => DefaultFormStyle::for($form->code)."\n"])
        ->assertOk()
        ->assertJsonPath('data.css_is_default', true);

    expect($form->fresh()->css)->toBeNull();
});

it('also recognizes the default style written with windows line breaks', function (): void {
    $form = contactForm();

    $this->patchJson("/api/forms/{$form->code}", ['css' => str_replace("\n", "\r\n", DefaultFormStyle::for($form->code))])
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

it('gives the default style of a form to anyone logged in, to go back to it', function (): void {
    $form = contactForm(['css' => 'button { color: red; }']);

    $this->getJson("/api/forms/{$form->code}/style/default")
        ->assertOk()
        ->assertJsonPath('data.css', DefaultFormStyle::for($form->code));
});

it('has a default style that finds everything by id, every id starting with the form code', function (): void {
    $css = DefaultFormStyle::for('abcdefghijklmnopqrst');

    expect($css)
        ->toContain('#abcdefghijklmnopqrst-form')->toContain('[id^="abcdefghijklmnopqrst-field-"]')->toContain('[id^="abcdefghijklmnopqrst-error-"]')
        ->toContain('#abcdefghijklmnopqrst-notice-failed')->toContain('#abcdefghijklmnopqrst-spinner')->toContain('button')->toContain('prefers-reduced-motion')
        ->not->toContain('@import')->not->toContain('</style')->not->toContain('__ID__')->not->toContain('__CSSID__');

    // No class selector anywhere (a number such as 0.2s is not one).
    expect($css)->not->toMatch('/^\s*[&]?\.[a-z][\w-]*\s*[{,:]/m')->not->toMatch('/[\s,>]\.[a-z][\w-]*\s*[{,]/');

    // Every rule lives inside the one element with the specific id (the animation apart): nothing can reach another page.
    $outside = preg_replace('/@keyframes\s+\w+\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/', '', $css);
    preg_match_all('/^[^\s}\/][^\n]*\{$/m', (string) $outside, $topLevel);
    expect($topLevel[0])->toBe(['#abcdefghijklmnopqrst-form {']);
});

it('writes the id the way CSS asks when the code starts with a digit', function (): void {
    expect(DefaultFormStyle::for('0abc'))->toContain('#\\30 abc-form {')->toContain('[id^="0abc-field-"]');
});

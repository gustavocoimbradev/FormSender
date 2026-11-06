<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Queue;

it('gives the name and the fields of a form to anyone, with no login', function (): void {
    $form = contactForm();

    $this->getJson("/api/forms/{$form->code}/public")
        ->assertOk()
        ->assertJsonPath('data.name', 'Contact')
        ->assertJsonPath('data.code', $form->code)
        ->assertJsonPath('data.fields.0', ['name' => 'name', 'label' => 'Name', 'type' => 'text', 'required' => true, 'options' => null])
        ->assertJsonPath('data.fields.3.options', ['Sales', 'Support']);
});

it('never gives away what is private', function (): void {
    $form = contactForm(['allowed_domains' => ['site.test'], 'email_subject' => 'Secret subject']);

    $response = $this->getJson("/api/forms/{$form->code}/public", ['Origin' => 'https://site.test'])->assertOk();

    expect($response->json('data'))->toHaveKeys(['name', 'code', 'fields'])
        ->and(array_keys($response->json('data')))->toHaveCount(3)
        ->and($response->getContent())->not->toContain('sales@example.com')->not->toContain('Secret subject')->not->toContain('site.test');
});

it('answers not found for a form that does not exist', function (): void {
    $this->getJson('/api/forms/doesnotexist/public')->assertNotFound();
});

it('only answers the sites the form allows', function (): void {
    $form = contactForm(['allowed_domains' => ['site.test']]);

    $this->getJson("/api/forms/{$form->code}/public", ['Origin' => 'https://site.test'])->assertOk();
    $this->getJson("/api/forms/{$form->code}/public", ['Origin' => 'https://other.test'])->assertForbidden();
});

it('lets the browser of an allowed site read it, and no other', function (): void {
    $form = contactForm(['allowed_domains' => ['site.test']]);

    $this->getJson("/api/forms/{$form->code}/public", ['Origin' => 'https://site.test'])
        ->assertHeader('Access-Control-Allow-Origin', 'https://site.test');

    $this->getJson("/api/forms/{$form->code}/public", ['Origin' => 'https://other.test'])
        ->assertHeaderMissing('Access-Control-Allow-Origin');
});

it('always lets the panel itself through, for the public page', function (): void {
    Queue::fake();
    configureSmtp();
    config(['formsender.panel_url' => 'https://panel.test']);
    $form = contactForm(['allowed_domains' => ['site.test']]);

    $this->getJson("/api/forms/{$form->code}/public", ['Origin' => 'https://panel.test'])
        ->assertOk()
        ->assertHeader('Access-Control-Allow-Origin', 'https://panel.test');

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission(), ['Origin' => 'https://panel.test'])
        ->assertStatus(202);
});

it('is limited per form and visitor, far above a real person', function (): void {
    // The limit of the whole API is higher here, so this one is the one reached.
    config(['app.api_rate_limit' => 1000]);
    $form = contactForm();

    foreach (range(1, 120) as $ignored) {
        $this->getJson("/api/forms/{$form->code}/public")->assertOk();
    }

    $this->getJson("/api/forms/{$form->code}/public")->assertTooManyRequests();
});

it('is served as a script every site can add', function (): void {
    expect(public_path('embed.js'))->toBeFile()
        ->and(file_get_contents(public_path('embed.js')))->toContain('data-form')->toContain('/public')->toContain('/submit');
});

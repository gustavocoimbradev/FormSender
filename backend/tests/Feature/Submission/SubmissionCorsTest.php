<?php

declare(strict_types=1);

use App\Models\Form;
use Illuminate\Support\Facades\Queue;

function preflight($test, Form $form, string $origin)
{
    return $test->call('OPTIONS', "/api/forms/{$form->code}/submit", server: [
        'HTTP_ORIGIN' => $origin,
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization,content-type',
    ]);
}

it('answers the preflight for an allowed origin', function (): void {
    $form = Form::factory()->create(['allowed_domains' => ['example.com']]);

    preflight($this, $form, 'https://example.com')
        ->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'https://example.com')
        ->assertHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        ->assertHeader('Vary', 'Origin');
});

it('allows any origin on the preflight when no domain is restricted', function (): void {
    $form = Form::factory()->create(['allowed_domains' => []]);

    preflight($this, $form, 'https://anything.test')
        ->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'https://anything.test');
});

it('refuses the preflight for an origin that is not allowed', function (): void {
    $form = Form::factory()->create(['allowed_domains' => ['example.com']]);

    preflight($this, $form, 'https://evil.test')
        ->assertForbidden()
        ->assertHeaderMissing('Access-Control-Allow-Origin');
});

it('adds the cors header to the actual submission response of an allowed origin', function (): void {
    Queue::fake();
    configureSmtp();
    $form = contactForm(['allowed_domains' => ['example.com']]);

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission(), ['Origin' => 'https://example.com'])
        ->assertStatus(202)
        ->assertHeader('Access-Control-Allow-Origin', 'https://example.com');
});

it('does not add the cors header for an origin that is not allowed', function (): void {
    $form = contactForm(['allowed_domains' => ['example.com']]);

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission(), ['Origin' => 'https://evil.test'])
        ->assertForbidden()
        ->assertHeaderMissing('Access-Control-Allow-Origin');
});

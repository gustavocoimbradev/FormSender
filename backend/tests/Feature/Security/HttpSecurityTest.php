<?php

it('sends security headers on api responses', function () {
    $this->getJson('/api/auth/me')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertHeader('Cache-Control', 'no-store, private');
});

it('answers cross-origin preflight only for the configured origin', function () {
    config(['cors.allowed_origins' => ['http://localhost:3000']]);

    $response = $this->call('OPTIONS', '/api/auth/login', server: [
        'HTTP_ORIGIN' => 'http://evil.example',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
    ]);

    expect($response->headers->get('Access-Control-Allow-Origin'))->toBe('http://localhost:3000');
});

it('does not allow credentials on cross-origin calls', function () {
    config(['cors.allowed_origins' => ['http://localhost:3000']]);

    $response = $this->call('OPTIONS', '/api/auth/login', server: [
        'HTTP_ORIGIN' => 'http://localhost:3000',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
    ]);

    expect($response->headers->get('Access-Control-Allow-Credentials'))->toBeNull();
});

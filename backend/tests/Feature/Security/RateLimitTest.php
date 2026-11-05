<?php

declare(strict_types=1);

it('limits how many requests a user can make per minute, and the limit is a setting', function (): void {
    config(['app.api_rate_limit' => 3]);
    actingAsUser();

    foreach (range(1, 3) as $request) {
        $this->getJson('/api/auth/me')->assertOk();
    }

    $this->getJson('/api/auth/me')->assertStatus(429);
});

it('defaults to 60 requests per minute', function (): void {
    expect(config('app.api_rate_limit'))->toBe(60);
});

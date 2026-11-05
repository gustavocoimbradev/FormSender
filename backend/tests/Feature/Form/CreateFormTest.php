<?php

declare(strict_types=1);

beforeEach(fn () => actingAsUser());

it('creates a form with a name', function (): void {
    $response = $this->postJson('/api/forms', ['name' => 'Contact']);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Contact');

    $this->assertDatabaseHas('forms', ['name' => 'Contact']);
});

it('requires a name to create a form', function (): void {
    $this->postJson('/api/forms', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
});

it('rejects a name longer than 255 characters', function (): void {
    $this->postJson('/api/forms', ['name' => str_repeat('a', 256)])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
});

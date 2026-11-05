<?php

declare(strict_types=1);

it('creates a form with a name', function (): void {
    $response = $this->postJson('/api/forms', ['name' => 'Contact']);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Contact');

    $this->assertDatabaseHas('forms', ['name' => 'Contact']);
});

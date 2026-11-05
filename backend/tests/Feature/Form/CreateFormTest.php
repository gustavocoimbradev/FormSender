<?php

it('creates a form with a name', function () {
    $response = $this->postJson('/api/forms', ['name' => 'Contact']);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Contact');

    $this->assertDatabaseHas('forms', ['name' => 'Contact']);
});

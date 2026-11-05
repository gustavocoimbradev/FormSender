<?php

beforeEach(fn () => actingAsUser());

use App\Models\Form;

it('shows a form', function () {
    $form = Form::factory()->create(['name' => 'Contact']);

    $this->getJson("/api/forms/{$form->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $form->id)
        ->assertJsonPath('data.name', 'Contact');
});

it('returns 404 for a form that does not exist', function () {
    $this->getJson('/api/forms/999')->assertNotFound();
});

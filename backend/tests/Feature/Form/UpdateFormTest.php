<?php

beforeEach(fn () => actingAsUser());

use App\Models\Form;

it('updates a form name', function () {
    $form = Form::factory()->create(['name' => 'Old']);

    $this->putJson("/api/forms/{$form->id}", ['name' => 'New'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New');

    $this->assertDatabaseHas('forms', ['id' => $form->id, 'name' => 'New']);
});

it('requires a name to update a form', function () {
    $form = Form::factory()->create();

    $this->putJson("/api/forms/{$form->id}", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
});

it('returns 404 when updating a form that does not exist', function () {
    $this->putJson('/api/forms/999', ['name' => 'New'])->assertNotFound();
});

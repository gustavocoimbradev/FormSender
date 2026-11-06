<?php

declare(strict_types=1);

beforeEach(fn () => actingAsAdmin());

use App\Models\Form;

it('updates a form name', function (): void {
    $form = Form::factory()->create(['name' => 'Old']);

    $this->putJson("/api/forms/{$form->code}", ['name' => 'New'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New');

    $this->assertDatabaseHas('forms', ['id' => $form->id, 'name' => 'New']);
});

it('requires a name to update a form', function (): void {
    $form = Form::factory()->create();

    $this->putJson("/api/forms/{$form->code}", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
});

it('returns 404 when updating a form that does not exist', function (): void {
    $this->putJson('/api/forms/999', ['name' => 'New'])->assertNotFound();
});

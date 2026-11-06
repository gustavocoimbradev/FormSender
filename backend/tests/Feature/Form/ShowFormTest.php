<?php

declare(strict_types=1);

beforeEach(fn () => actingAsAdmin());

use App\Models\Form;

it('shows a form', function (): void {
    $form = Form::factory()->create(['name' => 'Contact']);

    $this->getJson("/api/forms/{$form->code}")
        ->assertOk()
        ->assertJsonPath('data.code', $form->code)->assertJsonMissingPath('data.id')
        ->assertJsonPath('data.name', 'Contact');
});

it('returns 404 for a form that does not exist', function (): void {
    $this->getJson('/api/forms/999')->assertNotFound();
});

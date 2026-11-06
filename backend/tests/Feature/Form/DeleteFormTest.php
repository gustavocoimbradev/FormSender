<?php

declare(strict_types=1);

beforeEach(fn () => actingAsAdmin());

use App\Models\Form;

it('deletes a form', function (): void {
    $form = Form::factory()->create();

    $this->deleteJson("/api/forms/{$form->code}")->assertNoContent();

    $this->assertDatabaseMissing('forms', ['id' => $form->id]);
});

it('returns 404 when deleting a form that does not exist', function (): void {
    $this->deleteJson('/api/forms/999')->assertNotFound();
});

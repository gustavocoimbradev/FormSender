<?php

use App\Models\Form;

it('deletes a form', function () {
    $form = Form::factory()->create();

    $this->deleteJson("/api/forms/{$form->id}")->assertNoContent();

    $this->assertDatabaseMissing('forms', ['id' => $form->id]);
});

it('returns 404 when deleting a form that does not exist', function () {
    $this->deleteJson('/api/forms/999')->assertNotFound();
});

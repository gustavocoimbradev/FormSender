<?php

declare(strict_types=1);

use App\Models\Form;

beforeEach(fn () => actingAsAdmin());

it('lists the submissions of a form, newest first, with their processing status', function (): void {
    $form = Form::factory()->create();
    $older = submissionFor($form, ['status' => 'sent']);
    $newer = submissionFor($form, ['status' => 'failed', 'error' => 'SMTP down']);

    $this->getJson("/api/forms/{$form->code}/submissions")
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.0.status', 'failed')
        ->assertJsonPath('data.0.error', 'SMTP down')
        ->assertJsonPath('data.1.id', $older->id)
        ->assertJsonPath('data.1.values.name', 'Jane')
        ->assertJsonPath('data.1.deliveries.0.destination', 'sales@example.com')
        ->assertJsonStructure(['data' => [['id', 'status', 'values', 'destinations', 'deliveries', 'attempts', 'error', 'ip', 'origin', 'created_at', 'processed_at']], 'links', 'meta']);
});

it('only lists the submissions of the requested form', function (): void {
    $form = Form::factory()->create();
    $other = Form::factory()->create();
    submissionFor($form);
    submissionFor($other);

    $this->getJson("/api/forms/{$form->code}/submissions")->assertJsonCount(1, 'data');
});

it('filters submissions by status', function (): void {
    $form = Form::factory()->create();
    submissionFor($form, ['status' => 'sent']);
    submissionFor($form, ['status' => 'failed']);

    $this->getJson("/api/forms/{$form->code}/submissions?status=failed")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.status', 'failed');
});

it('rejects an unknown status filter', function (): void {
    $form = Form::factory()->create();

    $this->getJson("/api/forms/{$form->code}/submissions?status=nope")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('status');
});

it('shows one submission of the form', function (): void {
    $form = Form::factory()->create();
    $submission = submissionFor($form);

    $this->getJson("/api/forms/{$form->code}/submissions/{$submission->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $submission->id)
        ->assertJsonPath('data.form_name', $form->name);
});

it('does not show a submission through another form', function (): void {
    $form = Form::factory()->create();
    $other = Form::factory()->create();
    $submission = submissionFor($other);

    $this->getJson("/api/forms/{$form->code}/submissions/{$submission->id}")->assertNotFound();
});

it('keeps the submissions as an audit trail when the form is deleted', function (): void {
    $form = Form::factory()->create(['name' => 'Gone']);
    $submission = submissionFor($form, ['status' => 'sent']);

    $this->deleteJson("/api/forms/{$form->code}")->assertNoContent();

    $kept = $submission->fresh();

    expect($kept)->not->toBeNull()
        ->and($kept->form_id)->toBeNull()
        ->and($kept->form_name)->toBe('Gone')
        ->and($kept->data)->toBe(['name' => 'Jane', 'email' => 'jane@example.com']);
});

it('offers no way to change or delete a submission', function (): void {
    $form = Form::factory()->create();
    $submission = submissionFor($form);

    $this->deleteJson("/api/forms/{$form->code}/submissions/{$submission->id}")->assertStatus(405);
    $this->putJson("/api/forms/{$form->code}/submissions/{$submission->id}", [])->assertStatus(405);
});

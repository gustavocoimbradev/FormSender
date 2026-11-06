<?php

declare(strict_types=1);

use App\Actions\Submission\StoreFormSubmissionAction;
use App\Enums\SubmissionStatus;
use App\Jobs\SendFormSubmission;
use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Support\Facades\Queue;

function submissionWithStatus(SubmissionStatus $status, ?Form $form = null): FormSubmission
{
    $submission = app(StoreFormSubmissionAction::class)->execute($form ?? contactForm(), validSubmission());
    $submission->update(['status' => $status, 'error' => 'SMTP is down', 'attempts' => 3]);

    return $submission;
}

beforeEach(function (): void {
    Queue::fake();
    configureSmtp();
});

it('queues a failed submission again', function (SubmissionStatus $status): void {
    actingAsAdmin();
    $submission = submissionWithStatus($status);

    $this->postJson("/api/forms/{$submission->form->code}/submissions/{$submission->id}/retry")
        ->assertStatus(202)
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.error', null);

    Queue::assertPushed(SendFormSubmission::class, fn (SendFormSubmission $job): bool => $job->submission->is($submission));
    expect($submission->refresh()->status)->toBe(SubmissionStatus::Pending)
        ->and($submission->error)->toBeNull();
})->with([SubmissionStatus::Failed, SubmissionStatus::Partial]);

it('refuses to retry a submission that is not stuck', function (SubmissionStatus $status): void {
    actingAsAdmin();
    $submission = submissionWithStatus($status);

    $this->postJson("/api/forms/{$submission->form->code}/submissions/{$submission->id}/retry")
        ->assertUnprocessable();

    Queue::assertNothingPushed();
})->with([SubmissionStatus::Pending, SubmissionStatus::Processing, SubmissionStatus::Sent, SubmissionStatus::Spam]);

it('does not find a submission through another form', function (): void {
    actingAsAdmin();
    $submission = submissionWithStatus(SubmissionStatus::Failed);
    $other = Form::factory()->create();

    $this->postJson("/api/forms/{$other->code}/submissions/{$submission->id}/retry")
        ->assertNotFound();
});

it('answers not found for a submission that does not exist', function (): void {
    actingAsAdmin();
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submissions/999/retry")->assertNotFound();
});

it('requires a logged in user to retry', function (): void {
    $submission = submissionWithStatus(SubmissionStatus::Failed);

    $this->postJson("/api/forms/{$submission->form->code}/submissions/{$submission->id}/retry")
        ->assertUnauthorized();
});

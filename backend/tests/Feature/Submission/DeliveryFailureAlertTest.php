<?php

declare(strict_types=1);

use App\Actions\Submission\StoreFormSubmissionAction;
use App\Jobs\SendFormSubmission;
use App\Models\Form;
use App\Models\User;
use App\Notifications\SubmissionDeliveryFailed;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    configureSmtp();
    Notification::fake();
});

function failedJob(?Form $form = null): SendFormSubmission
{
    return new SendFormSubmission(app(StoreFormSubmissionAction::class)->execute($form ?? contactForm(), validSubmission()));
}

it('tells the owner of the form when a delivery fails for good', function (): void {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->create();
    $other = User::factory()->create();

    failedJob(contactForm(['user_id' => $owner->id]))->failed(new RuntimeException('SMTP is down'));

    Notification::assertSentTo($owner, SubmissionDeliveryFailed::class);
    Notification::assertNotSentTo([$admin, $other], SubmissionDeliveryFailed::class);
});

it('tells the admin when the form has no owner', function (): void {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    failedJob()->failed(new RuntimeException('SMTP is down'));

    Notification::assertSentTo($admin, SubmissionDeliveryFailed::class);
    Notification::assertNotSentTo($user, SubmissionDeliveryFailed::class);
});

it('does not fail when there is no admin to tell', function (): void {
    failedJob()->failed(new RuntimeException('SMTP is down'));

    Notification::assertNothingSent();
});

it('writes an email that names the form and the reason', function (): void {
    $job = failedJob();
    $job->failed(new RuntimeException('Connection refused'));
    $admin = User::factory()->admin()->create();

    $mail = (new SubmissionDeliveryFailed($job->submission->fresh()))->toMail($admin);

    expect($mail->subject)->toContain('Contact')
        ->and(implode(' ', $mail->introLines))->toContain('Connection refused')
        ->and($mail->from)->toBe(['no-reply@example.com', 'FormSender']);
});

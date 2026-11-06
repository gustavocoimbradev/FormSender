<?php

declare(strict_types=1);

use App\Actions\Submission\StoreFormSubmissionAction;
use App\Jobs\SendFormSubmission;
use App\Mail\FormSubmissionMail;
use App\Models\FormSubmission;
use App\Models\Setting;
use App\Models\Template;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Support\Facades\Mail;

function makeSubmission(?array $data = null): FormSubmission
{
    return app(StoreFormSubmissionAction::class)->execute(
        contactForm(),
        $data ?? ['name' => 'Jane', 'email' => 'jane@example.com'],
    );
}

/**
 * Replaces the mailer with one that rejects the destinations listed in the
 * returned state, which also records what was really sent.
 *
 * @param  list<string>  $rejected
 */
function mockMailer(array $rejected = []): stdClass
{
    $state = new stdClass;
    $state->sent = [];
    $state->rejected = $rejected;

    $mailer = Mockery::mock();
    $mailer->shouldReceive('to')->andReturnUsing(function (string $destination) use ($state) {
        $pending = Mockery::mock();
        $pending->shouldReceive('send')->andReturnUsing(function () use ($destination, $state): void {
            if (in_array($destination, $state->rejected, true)) {
                throw new RuntimeException("rejected {$destination}");
            }

            $state->sent[] = $destination;
        });

        return $pending;
    });

    Mail::shouldReceive('purge')->andReturnNull();
    Mail::shouldReceive('mailer')->with('saved-smtp')->andReturn($mailer);

    return $state;
}

beforeEach(function (): void {
    configureSmtp();
});

it('sends one email per destination and marks the submission as sent', function (): void {
    Mail::fake();
    $submission = makeSubmission();

    (new SendFormSubmission($submission))->handle();

    Mail::assertSentCount(2);
    Mail::assertSent(FormSubmissionMail::class, fn ($mail) => $mail->hasTo('sales@example.com') && ! $mail->hasTo('support@example.com'));
    Mail::assertSent(FormSubmissionMail::class, fn ($mail) => $mail->hasTo('support@example.com'));

    $submission->refresh();

    expect($submission->status->value)->toBe('sent')
        ->and($submission->attempts)->toBe(1)
        ->and($submission->processed_at)->not->toBeNull()
        ->and($submission->error)->toBeNull()
        ->and(collect($submission->deliveries)->pluck('status')->unique()->all())->toBe(['sent'])
        ->and($submission->deliveries[0]['sent_at'])->not->toBeNull();
});

it('sends from the configured smtp address and names the form in the subject', function (): void {
    Mail::fake();

    (new SendFormSubmission(makeSubmission()))->handle();

    Mail::assertSent(FormSubmissionMail::class, fn ($mail) => $mail->hasFrom('no-reply@example.com') && $mail->hasSubject('New message: Contact'));
});

it('delivers the email with the template chosen for the form', function (): void {
    Mail::fake();
    $template = Template::factory()->create(['subject' => 'Contato: {{field.name}}', 'html' => '<b>{{form_name}}</b> {{field.email}}']);
    $form = contactForm(['template_id' => $template->id]);
    $submission = app(StoreFormSubmissionAction::class)->execute($form, ['name' => 'Jane', 'email' => 'jane@example.com']);

    (new SendFormSubmission($submission))->handle();

    Mail::assertSent(FormSubmissionMail::class, fn ($mail) => $mail->hasSubject('Contato: Jane') && str_contains($mail->render(), '<b>Contact</b> jane@example.com'));
});

it('falls back to the default template when the form has none, or was deleted', function (): void {
    Mail::fake();
    $submission = makeSubmission();

    (new SendFormSubmission($submission))->handle();
    $submission->form->delete();
    (new SendFormSubmission($submission->fresh()))->handle();

    Mail::assertSent(FormSubmissionMail::class, fn ($mail) => $mail->hasSubject('New message: Contact') && str_contains($mail->render(), 'Form Sender'));
});

it('shows the sender up front, the other values by field label, and escapes html', function (): void {
    Mail::fake();

    (new SendFormSubmission(makeSubmission([
        'email' => 'jane@example.com',
        'name' => '<script>alert(1)</script>',
        'newsletter' => true,
    ])))->handle();

    Mail::assertSent(FormSubmissionMail::class, function ($mail): bool {
        $html = $mail->render();

        return str_contains($html, '&lt;script&gt;alert(1)&lt;/script&gt;')
            && ! str_contains($html, '<script>')
            && str_contains($html, 'jane@example.com')
            && str_contains($html, 'Newsletter');
    });
});

it('builds the mailer from the saved smtp settings', function (): void {
    Mail::fake();

    (new SendFormSubmission(makeSubmission()))->handle();

    expect(config('mail.mailers.saved-smtp'))->toMatchArray([
        'transport' => 'smtp',
        'host' => 'smtp.example.com',
        'port' => 465,
        'username' => 'user',
        'password' => 'secret',
        'scheme' => 'smtps',
    ]);
});

it('records which destinations failed and throws so the queue retries', function (): void {
    $state = mockMailer(['support@example.com']);
    $submission = makeSubmission();

    expect(fn () => (new SendFormSubmission($submission))->handle())->toThrow(RuntimeException::class);

    $submission->refresh();

    expect($state->sent)->toBe(['sales@example.com'])
        ->and($submission->status->value)->toBe('processing')
        ->and($submission->deliveries[0]['status'])->toBe('sent')
        ->and($submission->deliveries[1]['status'])->toBe('failed')
        ->and($submission->deliveries[1]['error'])->toContain('rejected support@example.com');
});

it('retries only the destinations that were not delivered', function (): void {
    $state = mockMailer(['support@example.com']);
    $submission = makeSubmission();

    try {
        (new SendFormSubmission($submission))->handle();
    } catch (RuntimeException) {
    }

    $state->rejected = [];
    $state->sent = [];
    (new SendFormSubmission($submission->fresh()))->handle();

    $submission->refresh();

    expect($state->sent)->toBe(['support@example.com'])
        ->and($submission->status->value)->toBe('sent')
        ->and($submission->attempts)->toBe(2)
        ->and(collect($submission->deliveries)->pluck('status')->unique()->all())->toBe(['sent']);
});

it('marks the submission as partial when it gives up after delivering to some destinations', function (): void {
    mockMailer(['support@example.com']);
    $submission = makeSubmission();
    $job = new SendFormSubmission($submission);

    try {
        $job->handle();
    } catch (RuntimeException $exception) {
        $job->failed($exception);
    }

    $submission->refresh();

    expect($submission->status->value)->toBe('partial')
        ->and($submission->error)->toContain('support@example.com')
        ->and($submission->processed_at)->not->toBeNull();
});

it('marks the submission as failed when nothing could be delivered', function (): void {
    mockMailer(['sales@example.com', 'support@example.com']);
    $submission = makeSubmission();
    $job = new SendFormSubmission($submission);

    try {
        $job->handle();
    } catch (RuntimeException $exception) {
        $job->failed($exception);
    }

    expect($submission->fresh()->status->value)->toBe('failed');
});

it('fails when smtp is not configured', function (): void {
    Setting::where('key', 'smtp')->delete();
    $submission = makeSubmission();
    $job = new SendFormSubmission($submission);

    try {
        $job->handle();
    } catch (RuntimeException $exception) {
        $job->failed($exception);
    }

    expect($submission->fresh()->status->value)->toBe('failed')
        ->and($submission->fresh()->error)->toContain('SMTP');
});

it('is configured to retry with backoff and to run after the transaction commits', function (): void {
    $job = new SendFormSubmission(makeSubmission());

    expect($job->tries)->toBe(3)
        ->and($job->backoff)->toBe([10, 60])
        ->and($job)->toBeInstanceOf(ShouldQueue::class)
        ->and($job)->toBeInstanceOf(ShouldQueueAfterCommit::class);
});

it('sets the reply-to to the email the visitor typed', function (): void {
    Mail::fake();
    $submission = makeSubmission(['name' => 'Jane', 'email' => 'jane@example.com']);

    (new SendFormSubmission($submission))->handle();

    Mail::assertSent(FormSubmissionMail::class, fn (FormSubmissionMail $mail): bool => $mail->hasReplyTo('jane@example.com'));
});

it('leaves the reply-to empty when the form has no email field', function (): void {
    Mail::fake();
    $form = contactForm(['fields' => [['name' => 'message', 'label' => 'Message', 'type' => 'textarea']]]);
    $submission = app(StoreFormSubmissionAction::class)->execute($form, ['message' => 'Hi']);

    (new SendFormSubmission($submission))->handle();

    Mail::assertSent(FormSubmissionMail::class, fn (FormSubmissionMail $mail): bool => $mail->replyTo === []);
});

it('ignores a stored email value that is not a valid address', function (): void {
    expect(makeSubmission(['name' => 'Jane', 'email' => "x@y.com\r\nBcc: a@b.com"])->replyToAddress())->toBeNull();
});

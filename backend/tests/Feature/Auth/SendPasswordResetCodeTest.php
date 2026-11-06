<?php

declare(strict_types=1);

use App\Jobs\SendPasswordResetCode;
use App\Mail\PasswordResetCodeMail;
use App\Models\Setting;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

beforeEach(function (): void {
    Mail::fake();
    configureSmtp();
});

it('emails the code to the user from the saved smtp address', function (): void {
    (new SendPasswordResetCode('jane@example.com', '123456'))->handle();

    Mail::assertSent(PasswordResetCodeMail::class, function (PasswordResetCodeMail $mail): bool {
        return $mail->hasTo('jane@example.com')
            && $mail->hasFrom('no-reply@example.com')
            && $mail->hasSubject('Your FormSender password reset code')
            && str_contains($mail->render(), '123456')
            && str_contains($mail->render(), '15 minutes');
    });
});

it('keeps the code out of the queue payload by encrypting the job', function (): void {
    $job = new SendPasswordResetCode('jane@example.com', '123456');

    expect($job)->toBeInstanceOf(ShouldQueue::class)->toBeInstanceOf(ShouldBeEncrypted::class);
});

it('fails when smtp is not configured', function (): void {
    Setting::where('key', 'smtp')->delete();

    (new SendPasswordResetCode('jane@example.com', '123456'))->handle();
})->throws(RuntimeException::class, 'SMTP is not configured.');

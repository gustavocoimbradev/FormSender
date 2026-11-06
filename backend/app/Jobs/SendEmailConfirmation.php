<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\EmailConfirmationMail;
use App\Models\EmailConfirmation;
use App\Support\SmtpMailer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

/**
 * Encrypted so the token never sits readable in the Redis queue payload.
 */
class SendEmailConfirmation implements ShouldBeEncrypted, ShouldQueue, ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 60];

    public int $timeout = 60;

    /**
     * @param  string  $subjectLine  Subject of the email.
     * @param  string  $intro  The sentence that says what is being confirmed.
     */
    public function __construct(
        public readonly string $email,
        public readonly string $token,
        public readonly string $subjectLine,
        public readonly string $intro,
    ) {}

    public function handle(): void
    {
        $smtp = SmtpMailer::configure();

        Mail::mailer(SmtpMailer::MAILER)
            ->to($this->email)
            ->send(new EmailConfirmationMail(
                $this->subjectLine,
                $this->intro,
                EmailConfirmation::link($this->token),
                $smtp['from_address'],
                $smtp['from_name'] ?? null,
            ));
    }
}

<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Auth\RequestPasswordResetAction;
use App\Mail\PasswordResetCodeMail;
use App\Support\SmtpMailer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

/**
 * Encrypted so the plain code never sits readable in the Redis queue payload.
 */
class SendPasswordResetCode implements ShouldBeEncrypted, ShouldQueue, ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 60];

    public int $timeout = 60;

    public function __construct(
        public readonly string $email,
        public readonly string $code,
    ) {}

    public function handle(): void
    {
        $smtp = SmtpMailer::configure();

        Mail::mailer(SmtpMailer::MAILER)
            ->to($this->email)
            ->send(new PasswordResetCodeMail(
                $this->code,
                RequestPasswordResetAction::CODE_TTL_MINUTES,
                $smtp['from_address'],
                $smtp['from_name'] ?? null,
            ));
    }
}

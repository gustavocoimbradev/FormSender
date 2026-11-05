<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\SubmissionStatus;
use App\Mail\FormSubmissionMail;
use App\Models\FormSubmission;
use App\Models\Setting;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class SendFormSubmission implements ShouldQueue, ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 60];

    public int $timeout = 60;

    public function __construct(public FormSubmission $submission) {}

    public function handle(): void
    {
        $smtp = Setting::where('key', 'smtp')->first()?->value;

        if ($smtp === null) {
            throw new RuntimeException('SMTP is not configured.');
        }

        $submission = $this->submission->refresh();
        $submission->status = SubmissionStatus::Processing;
        $submission->attempts++;
        $submission->save();

        $this->configureMailer($smtp);

        $deliveries = $submission->deliveries;
        $failed = [];

        foreach ($deliveries as $index => $delivery) {
            if ($delivery['status'] === 'sent') {
                continue;
            }

            try {
                Mail::mailer('form-submission')
                    ->to($delivery['destination'])
                    ->send(new FormSubmissionMail($submission, $smtp['from_address'], $smtp['from_name'] ?? null));

                $deliveries[$index] = [...$delivery, 'status' => 'sent', 'error' => null, 'sent_at' => now()->toIso8601String()];
            } catch (Throwable $exception) {
                $deliveries[$index] = [...$delivery, 'status' => 'failed', 'error' => Str::limit($exception->getMessage(), 500)];
                $failed[] = $delivery['destination'];
            }

            $submission->deliveries = $deliveries;
            $submission->save();
        }

        if ($failed !== []) {
            throw new RuntimeException('Delivery failed for: '.implode(', ', $failed));
        }

        $submission->status = SubmissionStatus::Sent;
        $submission->error = null;
        $submission->processed_at = now();
        $submission->save();
    }

    /**
     * Called by the queue once all attempts are used up.
     */
    public function failed(Throwable $exception): void
    {
        $submission = $this->submission->fresh();

        if ($submission === null) {
            return;
        }

        $delivered = collect($submission->deliveries)->contains('status', 'sent');

        $submission->status = $delivered ? SubmissionStatus::Partial : SubmissionStatus::Failed;
        $submission->error = Str::limit($exception->getMessage(), 1000);
        $submission->processed_at = now();
        $submission->save();
    }

    /**
     * @param  array<string, mixed>  $smtp
     */
    private function configureMailer(array $smtp): void
    {
        config(['mail.mailers.form-submission' => [
            'transport' => 'smtp',
            'host' => $smtp['host'],
            'port' => (int) $smtp['port'],
            'username' => $smtp['username'] ?? null,
            'password' => $smtp['password'] ?? null,
            'scheme' => ($smtp['encryption'] ?? null) === 'ssl' ? 'smtps' : null,
            'timeout' => 15,
        ]]);

        if (! Mail::isFake()) {
            Mail::purge('form-submission');
        }
    }
}

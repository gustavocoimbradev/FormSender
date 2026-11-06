<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\FormSubmission;
use App\Support\SmtpMailer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins that a message could not be delivered after every retry.
 */
class SubmissionDeliveryFailed extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 60];

    public function __construct(public FormSubmission $submission) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $smtp = SmtpMailer::configure();
        $delivered = $this->submission->status->value === 'partial';

        return (new MailMessage)
            ->mailer(SmtpMailer::MAILER)
            ->from($smtp['from_address'], $smtp['from_name'] ?? null)
            ->subject("A message from \"{$this->submission->form_name}\" could not be delivered")
            ->line($delivered
                ? "A message sent through \"{$this->submission->form_name}\" reached only some of its destinations."
                : "A message sent through \"{$this->submission->form_name}\" could not be delivered to any destination.")
            ->line('Reason: '.($this->submission->error ?? 'unknown'))
            ->line('The message is safe in your dashboard. Open the form, go to Messages and retry it once the problem is fixed.');
    }
}

<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\FormSubmission;
use App\Models\Template;
use App\Support\EmailTemplateRenderer;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class FormSubmissionMail extends Mailable
{
    /** @var array{subject: string, html: string}|null */
    private ?array $rendered = null;

    public function __construct(
        public readonly FormSubmission $submission,
        public readonly string $fromAddress,
        public readonly ?string $fromName = null,
    ) {}

    public function envelope(): Envelope
    {
        $replyTo = $this->submission->replyToAddress();

        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName),
            replyTo: $replyTo === null ? [] : [new Address($replyTo)],
            subject: $this->rendered()['subject'],
        );
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->rendered()['html']);
    }

    /**
     * @return list<Attachment>
     */
    public function attachments(): array
    {
        return array_map(
            fn (array $attachment): Attachment => Attachment::fromStorageDisk(config('formsender.attachments.disk'), $attachment['path'])
                ->as($attachment['name'])
                ->withMime($attachment['mime']),
            $this->submission->attachments,
        );
    }

    /**
     * The form's template, or the default one when it has none (or the form was deleted).
     *
     * @return array{subject: string, html: string}
     */
    private function rendered(): array
    {
        $template = ($this->submission->form_id === null ? null : $this->submission->form->template) ?? Template::defaultTemplate();

        return $this->rendered ??= app(EmailTemplateRenderer::class)->renderSubmission($template, $this->submission);
    }
}

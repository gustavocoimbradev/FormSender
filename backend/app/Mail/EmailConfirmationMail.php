<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\EmailConfirmation;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class EmailConfirmationMail extends Mailable
{
    public function __construct(
        public readonly string $subjectLine,
        public readonly string $intro,
        public readonly string $link,
        public readonly string $fromAddress,
        public readonly ?string $fromName = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName),
            subject: $this->subjectLine,
        );
    }

    public function content(): Content
    {
        return new Content(htmlString: sprintf(
            '<p>%s</p><p><a href="%s" style="display:inline-block;padding:12px 20px;background:#6d4aff;color:#ffffff;text-decoration:none;border-radius:8px">Confirm</a></p><p>Or open this address: %s</p><p>The link works for %d hours. If you did not ask for it, you can ignore this email.</p>',
            e($this->intro),
            e($this->link),
            e($this->link),
            EmailConfirmation::TTL_HOURS,
        ));
    }
}

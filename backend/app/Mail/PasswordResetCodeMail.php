<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PasswordResetCodeMail extends Mailable
{
    public function __construct(
        public readonly string $code,
        public readonly int $expiresInMinutes,
        public readonly string $fromAddress,
        public readonly ?string $fromName = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName),
            subject: 'Your FormSender password reset code',
        );
    }

    public function content(): Content
    {
        return new Content(htmlString: sprintf(
            '<p>Use this code to reset your password:</p><p style="font-size:24px;letter-spacing:4px"><strong>%s</strong></p><p>It expires in %d minutes. If you did not ask for it, you can ignore this email.</p>',
            e($this->code),
            $this->expiresInMinutes,
        ));
    }
}

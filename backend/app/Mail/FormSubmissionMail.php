<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\FormSubmission;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class FormSubmissionMail extends Mailable
{
    public function __construct(
        public readonly FormSubmission $submission,
        public readonly string $fromAddress,
        public readonly ?string $fromName = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName),
            subject: 'New submission: '.$this->submission->form_name,
        );
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->renderRows());
    }

    private function renderRows(): string
    {
        $rows = '';

        foreach ($this->submission->fields as $field) {
            if (! array_key_exists($field['name'], $this->submission->data)) {
                continue;
            }

            $rows .= $this->row((string) $field['label'], $this->display($field['type'], $this->submission->data[$field['name']]));
        }

        return '<h2>'.e($this->submission->form_name).'</h2><table cellpadding="6" cellspacing="0">'.$rows.'</table>';
    }

    private function row(string $label, string $value): string
    {
        return '<tr><td><strong>'.e($label).'</strong></td><td>'.nl2br(e($value)).'</td></tr>';
    }

    private function display(string $type, mixed $value): string
    {
        if ($type === 'checkbox') {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'Yes' : 'No';
        }

        return is_scalar($value) ? (string) $value : (string) json_encode($value);
    }
}

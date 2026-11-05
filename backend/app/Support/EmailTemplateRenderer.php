<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\FormSubmission;
use App\Models\Template;

/**
 * Fills a template's variables with a submission. The same code serves the real email and the
 * preview in the panel, so what people see while editing is what is delivered.
 *
 * Variables: {{form_name}} {{date}} {{origin}} {{ip}} {{fields}} {{field.NAME}} {{label.NAME}}
 */
class EmailTemplateRenderer
{
    private const TOKEN = '/\{\{\s*(form_name|date|origin|ip|fields|field\.[a-z][a-z0-9_]*|label\.[a-z][a-z0-9_]*)\s*\}\}/';

    /**
     * @return array{subject: string, html: string}
     */
    public function renderSubmission(Template $template, FormSubmission $submission): array
    {
        $subject = $this->fill($template->subject, $submission, asHtml: false);

        return [
            'subject' => trim((string) preg_replace('/\s+/u', ' ', $subject)),
            'html' => $this->fill($template->html, $submission, asHtml: true),
        ];
    }

    /**
     * @return array{subject: string, html: string}
     */
    public function renderSample(string $subject, string $html): array
    {
        $sample = new FormSubmission([
            'form_name' => 'Contact form',
            'fields' => [
                ['name' => 'name', 'label' => 'Name', 'type' => 'text'],
                ['name' => 'email', 'label' => 'Email', 'type' => 'email'],
                ['name' => 'message', 'label' => 'Message', 'type' => 'textarea'],
            ],
            'data' => ['name' => 'Maria Souza', 'email' => 'maria@company.com', 'message' => "Hi! I would like to know more about your plans.\nCould you get back to me today?"],
            'origin' => 'yoursite.com',
            'ip' => '203.0.113.10',
        ]);
        $sample->created_at = now();

        return $this->renderSubmission(new Template(['name' => 'Sample', 'subject' => $subject, 'html' => $html]), $sample);
    }

    private function fill(string $text, FormSubmission $submission, bool $asHtml): string
    {
        return (string) preg_replace_callback(self::TOKEN, function (array $match) use ($submission, $asHtml): string {
            $token = $match[1];

            if ($token === 'fields') {
                return $asHtml ? $this->fieldsTable($submission) : '';
            }

            $value = $this->value($token, $submission);

            if ($value === null) {
                return $match[0];
            }

            return $asHtml ? nl2br(e($value)) : $value;
        }, $text);
    }

    private function value(string $token, FormSubmission $submission): ?string
    {
        if ($token === 'form_name') {
            return (string) $submission->form_name;
        }

        if ($token === 'date') {
            return $submission->created_at?->format('Y-m-d H:i') ?? '';
        }

        if ($token === 'origin' || $token === 'ip') {
            return (string) $submission->getAttribute($token);
        }

        [$kind, $name] = explode('.', $token, 2);

        foreach ($submission->fields as $field) {
            if ($field['name'] !== $name) {
                continue;
            }

            if ($kind === 'label') {
                return (string) $field['label'];
            }

            return array_key_exists($name, $submission->data) ? $this->display($field['type'], $submission->data[$name]) : '';
        }

        return '';
    }

    private function fieldsTable(FormSubmission $submission): string
    {
        $font = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
        $rows = '';

        foreach ($submission->fields as $field) {
            if (! array_key_exists($field['name'], $submission->data)) {
                continue;
            }

            $label = e((string) $field['label']);
            $value = nl2br(e($this->display($field['type'], $submission->data[$field['name']])));

            $rows .= '<tr><td style="padding:14px 0;border-top:1px solid #23233a;'.$font.'">'
                .'<div style="font-size:14px;color:#7e7e96;padding-bottom:4px;">'.$label.'</div>'
                .'<div style="font-size:16px;line-height:1.5;color:#f4f4fb;">'.$value.'</div></td></tr>';
        }

        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'.$rows.'</table>';
    }

    private function display(string $type, mixed $value): string
    {
        if ($type === 'checkbox') {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'Yes' : 'No';
        }

        return is_scalar($value) ? (string) $value : (string) json_encode($value);
    }
}

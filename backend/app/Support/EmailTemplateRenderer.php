<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\FormSubmission;
use Illuminate\Support\Str;

/**
 * Fills a template's variables with a submission. The same code serves the real email and the
 * preview in the panel, so what people see while editing is what is delivered.
 *
 * Variables: {{form_name}} {{date}} {{origin}} {{ip}} {{fields}} {{field.NAME}} {{label.NAME}}
 *
 * {{fields}} lists the answers the template did not already place one by one with {{field.NAME}}.
 * A block {{#field.NAME}}...{{/field.NAME}} only shows when that field has a value.
 */
class EmailTemplateRenderer
{
    private const SECTION = '/\{\{#(field\.[a-z][a-z0-9_]*)\}\}(.*?)\{\{\/\1\}\}/s';

    private const PLACED_FIELD = '/\{\{\s*field\.([a-z][a-z0-9_]*)\s*\}\}/';

    private const TOKEN = '/\{\{\s*(form_name|date|origin|ip|fields|field\.[a-z][a-z0-9_]*|label\.[a-z][a-z0-9_]*)\s*\}\}/';

    /**
     * @return array{subject: string, html: string}
     */
    public function renderSubmission(string $subject, string $html, FormSubmission $submission): array
    {
        $filledSubject = $this->fill($subject, $submission, asHtml: false);

        // Answers already placed one by one in the body are not repeated by {{fields}}.
        preg_match_all(self::PLACED_FIELD, $html, $placed);

        return [
            'subject' => trim((string) preg_replace('/\s+/u', ' ', $filledSubject)),
            'html' => $this->fill($html, $submission, asHtml: true, placed: array_unique($placed[1])),
        ];
    }

    /**
     * The email filled with example answers, for the preview. When the fields of the form being edited are
     * given, the example answers are theirs; otherwise a small contact form is used.
     *
     * @param  list<array{name: string, label: string, type: string, options?: list<string>|null}>|null  $fields
     * @return array{subject: string, html: string}
     */
    public function renderSample(string $subject, string $html, ?array $fields = null): array
    {
        $fields = $fields === null || $fields === []
            ? [
                ['name' => 'name', 'label' => 'Name', 'type' => 'text'],
                ['name' => 'email', 'label' => 'Email', 'type' => 'email'],
                ['name' => 'message', 'label' => 'Message', 'type' => 'textarea'],
            ]
            : $fields;

        $sample = new FormSubmission([
            'form_name' => 'Contact form',
            'fields' => $fields,
            'data' => collect($fields)->mapWithKeys(fn (array $field): array => [$field['name'] => $this->exampleAnswer($field)])->all(),
            'origin' => 'yoursite.com',
            'ip' => '203.0.113.10',
        ]);
        $sample->created_at = now();

        return $this->renderSubmission($subject, $html, $sample);
    }

    /**
     * @param  array{name: string, label: string, type: string, options?: list<string>|null}  $field
     */
    private function exampleAnswer(array $field): string|bool
    {
        return match ($field['type']) {
            'email' => 'maria@company.com',
            'phone' => '+1 555 0100',
            'number' => '42',
            'textarea' => "Hi! I would like to know more about your plans.\nCould you get back to me today?",
            'select' => $field['options'][0] ?? 'Option',
            'checkbox' => true,
            'date' => now()->format('Y-m-d'),
            'file' => 'document.pdf',
            default => $field['name'] === 'name' ? 'Maria Souza' : Str::of($field['label'])->title()->toString().' example',
        };
    }

    /**
     * @param  list<string>  $placed  names of the fields the template already shows by itself
     */
    private function fill(string $text, FormSubmission $submission, bool $asHtml, array $placed = []): string
    {
        // Blocks first, on the template alone: a submitted value can never open or close one. Blocks may
        // be nested, so the template is cleaned until nothing changes (a block never grows the text).
        do {
            $before = $text;
            $text = (string) preg_replace_callback(
                self::SECTION,
                fn (array $match): string => trim((string) $this->value($match[1], $submission)) === '' ? '' : $match[2],
                $text,
            );
        } while ($text !== $before);

        return (string) preg_replace_callback(self::TOKEN, function (array $match) use ($submission, $asHtml, $placed): string {
            $token = $match[1];

            if ($token === 'fields') {
                return $asHtml ? $this->fieldsTable($submission, $placed) : '';
            }

            $value = $this->value($token, $submission);

            return $asHtml ? nl2br(e($value)) : $value;
        }, $text);
    }

    private function value(string $token, FormSubmission $submission): string
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

    /**
     * @param  list<string>  $placed
     */
    private function fieldsTable(FormSubmission $submission, array $placed = []): string
    {
        $font = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
        $rows = '';

        foreach ($submission->fields as $field) {
            if (! array_key_exists($field['name'], $submission->data) || in_array($field['name'], $placed, true)) {
                continue;
            }

            $label = e((string) $field['label']);
            $value = nl2br(e($this->display($field['type'], $submission->data[$field['name']])));

            $rows .= '<tr><td style="padding:14px 0;border-top:1px solid #23233a;'.$font.'">'
                .'<div style="font-size:14px;color:#7e7e96;padding-bottom:4px;">'.$label.'</div>'
                .'<div style="font-size:16px;line-height:1.5;color:#f4f4fb;">'.$value.'</div></td></tr>';
        }

        return $rows === '' ? '' : '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'.$rows.'</table>';
    }

    private function display(string $type, mixed $value): string
    {
        if ($type === 'checkbox') {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'Yes' : 'No';
        }

        return is_scalar($value) ? (string) $value : (string) json_encode($value);
    }
}

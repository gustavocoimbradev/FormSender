<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FormFieldType;
use App\Models\Concerns\HasPublicCode;
use App\Support\DefaultEmailTemplate;
use App\Support\DefaultFormStrings;
use App\Support\DefaultFormStyle;
use Database\Factories\FormFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\Rule;

/**
 * @property list<array<string, mixed>> $fields
 * @property list<string> $destinations
 * @property list<string> $allowed_domains
 * @property string|null $email_subject
 * @property string|null $email_html
 * @property string|null $css
 * @property array<string, string>|null $strings
 */
class Form extends Model
{
    /** @use HasFactory<FormFactory> */
    use HasFactory, HasPublicCode;

    protected $fillable = ['name', 'fields', 'destinations', 'allowed_domains', 'email_subject', 'email_html', 'css', 'strings'];

    protected $attributes = [
        'fields' => '[]',
        'destinations' => '[]',
        'allowed_domains' => '[]',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'destinations' => 'array',
            'allowed_domains' => 'array',
        ];
    }

    /**
     * The subject and body of the email delivered for this form's messages: the ones written for the form,
     * or the default email for whatever was left empty.
     *
     * @return array{subject: string, html: string}
     */
    public function email(): array
    {
        return [
            'subject' => $this->email_subject ?? DefaultEmailTemplate::SUBJECT,
            'html' => $this->email_html ?? DefaultEmailTemplate::HTML,
        ];
    }

    /**
     * The CSS the embedded form is drawn with: the one written for the form, or the default style.
     */
    public function style(): string
    {
        return $this->css ?? DefaultFormStyle::CSS;
    }

    /**
     * Every text the embedded form shows: the ones changed for this form, and the default words for the rest.
     *
     * @return array<string, string>
     */
    public function texts(): array
    {
        return [...DefaultFormStrings::texts(), ...($this->strings ?? [])];
    }

    public function usesDefaultStrings(): bool
    {
        return $this->strings === null;
    }

    public function usesDefaultStyle(): bool
    {
        return $this->css === null;
    }

    public function usesDefaultEmail(): bool
    {
        return $this->email_subject === null && $this->email_html === null;
    }

    /**
     * Text that is the default email is not stored: the form keeps following the default.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function emailSubject(): Attribute
    {
        return Attribute::set(fn (?string $value): ?string => $value === null || $value === DefaultEmailTemplate::SUBJECT ? null : $value);
    }

    /**
     * Only the texts that were really changed are stored (known ones, with words, different from the default), so
     * the others keep following the defaults as these improve.
     *
     * @return Attribute<array<string, string>|null, array<mixed>|null>
     */
    protected function strings(): Attribute
    {
        return Attribute::make(get: fn (?string $value): ?array => $value === null ? null : json_decode($value, true, 512, JSON_THROW_ON_ERROR), set: function (?array $value): ?string {
            $defaults = DefaultFormStrings::texts();
            $changed = [];

            foreach ($value ?? [] as $key => $text) {
                $text = is_string($text) ? trim($text) : '';

                if (isset($defaults[$key]) && $text !== '' && $text !== $defaults[$key]) {
                    $changed[$key] = $text;
                }
            }

            return $changed === [] ? null : json_encode($changed, JSON_THROW_ON_ERROR);
        });
    }

    /**
     * Like the email, a style that is the default one is not stored. Line breaks of any system count the same.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function css(): Attribute
    {
        $clean = fn (string $css): string => trim(str_replace("\r\n", "\n", $css));

        return Attribute::set(fn (?string $value): ?string => $value === null || $clean($value) === '' || $clean($value) === $clean(DefaultFormStyle::CSS) ? null : $clean($value));
    }

    /**
     * @return Attribute<string|null, string|null>
     */
    protected function emailHtml(): Attribute
    {
        return Attribute::set(fn (?string $value): ?string => $value === null || $value === DefaultEmailTemplate::HTML ? null : $value);
    }

    /**
     * @return HasMany<FormSubmission, $this>
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    /**
     * An empty list means any domain may submit. Entries are hosts, optionally
     * starting with "*." to match subdomains only.
     */
    public function allowsHost(?string $host): bool
    {
        // The panel's own public page can always show and send the form.
        if ($host !== null && $host === $this->panelHost()) {
            return true;
        }

        if ($this->allowed_domains === []) {
            return true;
        }

        if ($host === null) {
            return false;
        }

        foreach ($this->allowed_domains as $domain) {
            if (str_starts_with($domain, '*.')) {
                if (str_ends_with($host, substr($domain, 1))) {
                    return true;
                }

                continue;
            }

            if ($host === $domain) {
                return true;
            }
        }

        return false;
    }

    private function panelHost(): ?string
    {
        $host = parse_url((string) config('formsender.panel_url'), PHP_URL_HOST);

        return is_string($host) ? strtolower($host) : null;
    }

    /**
     * Validation rules for a submission: only the accepted fields are validated
     * (and therefore kept).
     *
     * @return array<string, list<mixed>>
     */
    public function submissionRules(): array
    {
        $rules = [];

        foreach ($this->fields as $field) {
            $rules[$field['name']] = [
                ($field['required'] ?? false) ? 'required' : 'nullable',
                ...$this->rulesForType(FormFieldType::from($field['type']), $field['options'] ?? []),
            ];
        }

        return $rules;
    }

    /**
     * @param  list<string>  $options
     * @return list<mixed>
     */
    private function rulesForType(FormFieldType $type, array $options): array
    {
        return match ($type) {
            FormFieldType::Text => ['string', 'max:255'],
            FormFieldType::Textarea => ['string', 'max:5000'],
            FormFieldType::Email => ['email', 'max:255'],
            FormFieldType::Phone => ['string', 'max:50'],
            FormFieldType::Number => ['numeric'],
            FormFieldType::Select => [Rule::in($options)],
            FormFieldType::Checkbox => ['boolean'],
            FormFieldType::Date => ['date'],
            FormFieldType::File => [
                'file',
                'max:'.config('formsender.attachments.max_kilobytes'),
                'extensions:'.implode(',', config('formsender.attachments.extensions')),
                'mimes:'.implode(',', config('formsender.attachments.extensions')),
            ],
        };
    }
}

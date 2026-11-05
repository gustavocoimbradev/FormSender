<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FormFieldType;
use App\Models\Concerns\HasPublicCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\Rule;

/**
 * @property list<array<string, mixed>> $fields
 * @property list<string> $destinations
 * @property list<string> $allowed_domains
 */
class Form extends Model
{
    use HasFactory, HasPublicCode;

    protected $fillable = ['name', 'fields', 'destinations', 'allowed_domains', 'template_id'];

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
     * @return BelongsTo<Template, $this>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
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
        };
    }
}

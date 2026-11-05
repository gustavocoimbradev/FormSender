<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FormFieldType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @property list<array<string, mixed>> $fields
 * @property list<string> $destinations
 * @property list<string> $allowed_domains
 */
class Form extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'fields', 'destinations', 'allowed_domains'];

    protected $attributes = [
        'fields' => '[]',
        'destinations' => '[]',
        'allowed_domains' => '[]',
    ];

    protected static function booted(): void
    {
        static::creating(function (Form $form): void {
            $form->code ??= static::newCode();
        });
    }

    /**
     * Forms are addressed by their code everywhere, never by the numeric id.
     */
    public function getRouteKeyName(): string
    {
        return 'code';
    }

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
     * @return HasMany<FormSubmission, $this>
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    /**
     * The public code websites send the form to. Random and not tied to the id,
     * so nobody can walk through the forms by counting.
     */
    public static function newCode(): string
    {
        do {
            $code = strtolower(Str::random(20));
        } while (static::where('code', $code)->exists());

        return $code;
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

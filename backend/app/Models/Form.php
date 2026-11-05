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

    protected $hidden = ['token_hash'];

    protected $attributes = [
        'fields' => '[]',
        'destinations' => '[]',
        'allowed_domains' => '[]',
    ];

    protected static function booted(): void
    {
        static::creating(function (Form $form): void {
            $form->regenerateToken();
        });
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
            'token' => 'encrypted',
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
     * Replaces the token with a new random one that no other form uses.
     * The caller is responsible for saving the model.
     */
    public function regenerateToken(): void
    {
        do {
            $token = 'fs_'.Str::random(48);
            $hash = hash('sha256', $token);
        } while (static::where('token_hash', $hash)->exists());

        $this->token = $token;
        $this->token_hash = $hash;
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

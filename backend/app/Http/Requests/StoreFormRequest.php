<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\FormFieldType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFormRequest extends FormRequest
{
    private const DOMAIN = '/^(?:(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}|localhost)$/';

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Accept domains the way people paste them (with scheme, path, port,
     * spaces or upper case) and store just the lowercase host.
     */
    protected function prepareForValidation(): void
    {
        $domains = $this->input('allowed_domains');

        if (! is_array($domains)) {
            return;
        }

        $this->merge([
            'allowed_domains' => array_values(array_unique(array_map(
                fn (mixed $domain): mixed => is_string($domain) ? $this->normalizeDomain($domain) : $domain,
                $domains,
            ), SORT_REGULAR)),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'fields' => ['array', 'max:50'],
            'fields.*.name' => ['required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_]*$/', 'distinct'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.type' => ['required', Rule::enum(FormFieldType::class)],
            'fields.*.required' => ['boolean'],
            'fields.*.options' => ['nullable', 'required_if:fields.*.type,select', 'array', 'min:1', 'max:100'],
            'fields.*.options.*' => ['string', 'max:255'],
            'destinations' => ['array', 'max:20'],
            'destinations.*' => ['email:rfc', 'max:255', 'distinct:ignore_case'],
            'allowed_domains' => ['array', 'max:50'],
            'allowed_domains.*' => ['string', 'max:253', 'regex:'.self::DOMAIN, 'distinct'],
        ];

        // A partial update (PATCH) validates only the attributes that were sent.
        if ($this->isMethod('PATCH')) {
            return array_map(
                fn (array $ruleSet): array => ['sometimes', ...$ruleSet],
                $rules,
            );
        }

        return $rules;
    }

    private function normalizeDomain(string $domain): string
    {
        $domain = strtolower(trim($domain));
        $domain = (string) preg_replace('#^[a-z][a-z0-9+.-]*://#', '', $domain);
        $domain = (string) preg_replace('#[/?\#].*$#', '', $domain);

        return (string) preg_replace('#:\d+$#', '', $domain);
    }
}

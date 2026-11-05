<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use App\Enums\FormFieldType;
use App\Models\Template;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

#[SchemaName('NewForm')]
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
     * The panel talks about templates by code; the form stores the id.
     *
     * @return array<string, mixed>
     */
    public function validatedForForm(): array
    {
        $data = $this->validated();

        if (array_key_exists('template', $data)) {
            $data['template_id'] = $data['template'] === null ? null : Template::where('code', $data['template'])->value('id');
            unset($data['template']);
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            /**
             * Name of the form, shown to your team.
             *
             * @example Contact us
             */
            'name' => ['required', 'string', 'max:255'],
            /**
             * The fields the form accepts (up to 50). Anything else sent is ignored.
             *
             * @example [{"name": "email", "label": "Email", "type": "email", "required": true}, {"name": "message", "label": "Message", "type": "textarea"}]
             */
            'fields' => ['array', 'max:50'],
            /**
             * Technical name of the field, used as the key when the form is submitted. Lowercase letters, numbers and `_`.
             *
             * @example email
             */
            'fields.*.name' => ['required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_]*$/', 'distinct'],
            /**
             * Label shown to people, also used in the email.
             *
             * @example Your email
             */
            'fields.*.label' => ['required', 'string', 'max:255'],
            /**
             * Kind of field: `text`, `email`, `phone`, `number`, `textarea`, `select`, `checkbox` or `date`.
             *
             * @example email
             */
            'fields.*.type' => ['required', Rule::enum(FormFieldType::class)],
            /**
             * Whether the visitor must fill it in.
             *
             * @example true
             */
            'fields.*.required' => ['boolean'],
            /**
             * The allowed choices. Required for `select` fields.
             *
             * @example ["Sales", "Support"]
             */
            'fields.*.options' => ['nullable', 'required_if:fields.*.type,select', 'array', 'min:1', 'max:100'],
            /**
             * One allowed choice.
             *
             * @example Sales
             */
            'fields.*.options.*' => ['string', 'max:255'],
            /**
             * Email addresses that receive every message (up to 20).
             *
             * @example ["sales@company.com", "support@company.com"]
             */
            'destinations' => ['array', 'max:20'],
            /**
             * One destination email address.
             *
             * @example sales@company.com
             */
            'destinations.*' => ['email:rfc', 'max:255', 'distinct:ignore_case'],
            /**
             * Websites allowed to send this form, e.g. `company.com` or `*.company.com` (subdomains). Leave empty to allow any website.
             *
             * @example ["company.com", "*.company.com"]
             */
            'allowed_domains' => ['array', 'max:50'],
            /**
             * One allowed website. Pasting a full URL works: the protocol, path and port are removed.
             *
             * @example company.com
             */
            'allowed_domains.*' => ['string', 'max:253', 'regex:'.self::DOMAIN, 'distinct'],
            /**
             * Code of the template used for the email. Leave empty (null) to use the default template.
             *
             * @example 7k2mx9q4vb8d1ncz5wte
             */
            'template' => ['nullable', 'string', 'exists:templates,code'],
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

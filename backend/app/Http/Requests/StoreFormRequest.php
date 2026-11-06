<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\FormFieldType;
use App\Support\DefaultFormStrings;
use Dedoc\Scramble\Attributes\SchemaName;
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
             * Kind of field: `text`, `email`, `phone`, `number`, `textarea`, `select`, `checkbox`, `date` or `file` (an attachment, up to 5 MB, sent as a file upload).
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
             * Subject of the email delivered for this form's messages. Leave empty (null) for the default subject. Variables such as `{{form_name}}` are filled in with each message.
             *
             * @example New message: {{form_name}}
             */
            'email_subject' => ['nullable', 'string', 'max:200'],
            /**
             * HTML body of that email, written for email clients. Leave empty (null) for the default email. Scripts are not allowed.
             *
             * @example <h1>{{form_name}}</h1>{{fields}}
             */
            'email_html' => ['nullable', 'string', 'max:100000', 'not_regex:/<\s*script/i'],
            /**
             * CSS that draws the embedded form (a script on a site, an iframe or the form's public page). Leave empty (null) for the default style. It only applies to the form, never to the page around it. Importing other stylesheets is not allowed.
             *
             * @example .formsender { --accent: #0a7cff; }
             */
            'css' => ['nullable', 'string', 'max:50000', 'not_regex:/@import/i', 'not_regex:/<\s*\/?\s*style/i'],
            /**
             * The texts the embedded form shows by itself, by name (see the default texts for the names and what each is for). Send only the ones to change; a text left empty (or null) goes back to the default words. Leave empty (null) for all the default texts.
             *
             * @example {"send": "Enviar", "sent": "Mensagem enviada!"}
             */
            'strings' => ['nullable', 'array:'.implode(',', array_keys(DefaultFormStrings::texts()))],
            /**
             * One text (up to 200 characters).
             *
             * @example Enviar
             */
            'strings.*' => ['nullable', 'string', 'max:200'],
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

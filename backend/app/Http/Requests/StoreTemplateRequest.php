<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;

#[SchemaName('NewTemplate')]
class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            /**
             * Name of the template, shown to your team.
             *
             * @example Promocional
             */
            'name' => ['required', 'string', 'max:100'],
            /**
             * Subject of the email, in plain text. Variables such as `{{form_name}}` are filled in.
             *
             * @example Nova mensagem: {{form_name}}
             */
            'subject' => ['required', 'string', 'max:200'],
            /**
             * Body of the email, as HTML made for email clients (tables and inline styles). Variables such as `{{fields}}` are filled in. Scripts are not allowed.
             *
             * @example <h1>{{form_name}}</h1>{{fields}}
             */
            'html' => ['required', 'string', 'max:100000', 'not_regex:/<\s*script/i'],
        ];

        if ($this->isMethod('PATCH')) {
            return array_map(fn (array $ruleSet): array => ['sometimes', ...$ruleSet], $rules);
        }

        return $rules;
    }
}

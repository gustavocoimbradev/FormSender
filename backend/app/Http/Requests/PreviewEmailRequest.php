<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\FormFieldType;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

#[SchemaName('EmailPreviewInput')]
class PreviewEmailRequest extends FormRequest
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
        return [
            /**
             * Subject of the email to preview.
             *
             * @example New message: {{form_name}}
             */
            'subject' => ['present', 'nullable', 'string', 'max:200'],
            /**
             * HTML of the email to preview. Scripts are not allowed.
             *
             * @example <h1>{{form_name}}</h1>{{fields}}
             */
            'html' => ['required', 'string', 'max:100000', 'not_regex:/<\s*script/i'],
            /**
             * The fields of the form being edited, so the preview shows example answers for them. Leave it out for a small contact form.
             *
             * @example [{"name": "company", "label": "Company", "type": "text"}]
             */
            'fields' => ['sometimes', 'array', 'max:50'],
            /**
             * Technical name of the field.
             *
             * @example company
             */
            'fields.*.name' => ['required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_]*$/'],
            /**
             * Label of the field.
             *
             * @example Company
             */
            'fields.*.label' => ['required', 'string', 'max:255'],
            /**
             * Kind of field.
             *
             * @example text
             */
            'fields.*.type' => ['required', Rule::enum(FormFieldType::class)],
            /**
             * The choices of a `select` field.
             *
             * @example ["Sales", "Support"]
             */
            'fields.*.options' => ['nullable', 'array', 'max:100'],
            /**
             * One choice.
             *
             * @example Sales
             */
            'fields.*.options.*' => ['string', 'max:255'],
        ];
    }
}

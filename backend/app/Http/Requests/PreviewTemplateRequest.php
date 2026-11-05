<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;

#[SchemaName('TemplatePreviewInput')]
class PreviewTemplateRequest extends FormRequest
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
        ];
    }
}

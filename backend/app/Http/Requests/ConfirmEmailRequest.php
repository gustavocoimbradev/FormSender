<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;

#[SchemaName('EmailConfirmationToken')]
class ConfirmEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            /**
             * The token that came in the link of the email.
             *
             * @example 8Kq2mZ4wPx7vLd9sRt3nYb6hJc1fGa5eUo0iWk2XqT7zNp4M
             */
            'token' => ['required', 'string', 'max:100'],
        ];
    }
}

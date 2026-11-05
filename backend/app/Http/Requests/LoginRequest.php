<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;

#[SchemaName('Credentials')]
class LoginRequest extends FormRequest
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
             * The email address of the account.
             *
             * @example jane@company.com
             */
            'email' => ['required', 'email'],
            /**
             * The account password.
             *
             * @example my-secret-password
             */
            'password' => ['required', 'string'],
        ];
    }
}

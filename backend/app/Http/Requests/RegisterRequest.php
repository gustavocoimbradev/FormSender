<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

#[SchemaName('NewAccount')]
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            /**
             * Your name.
             *
             * @example Jane Doe
             */
            'name' => ['required', 'string', 'max:255'],
            /**
             * Email used to log in. A link to confirm it is sent there.
             *
             * @example jane@company.com
             */
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            /**
             * Password, at least 8 characters.
             *
             * @example a-long-secret-password
             */
            'password' => ['required', 'string', Password::min(8)],
        ];
    }
}

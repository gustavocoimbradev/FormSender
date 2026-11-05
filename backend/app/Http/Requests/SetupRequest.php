<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

#[SchemaName('InitialAdmin')]
class SetupRequest extends FormRequest
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
             * Name of the administrator. Defaults to "Admin".
             *
             * @example Jane Doe
             */
            'name' => ['nullable', 'string', 'max:255'],
            /**
             * Email used to log in.
             *
             * @example jane@company.com
             */
            'email' => ['required', 'email', 'max:255'],
            /**
             * Password, at least 8 characters.
             *
             * @example a-long-secret-password
             */
            'password' => ['required', 'string', Password::min(8)],
        ];
    }
}

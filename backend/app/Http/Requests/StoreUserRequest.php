<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

#[SchemaName('NewUser')]
class StoreUserRequest extends FormRequest
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
             * Full name.
             *
             * @example John Smith
             */
            'name' => ['required', 'string', 'max:255'],
            /**
             * Email used to log in. Must not be used by another user.
             *
             * @example john@company.com
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

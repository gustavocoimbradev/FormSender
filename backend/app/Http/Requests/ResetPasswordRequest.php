<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

#[SchemaName('NewPassword')]
class ResetPasswordRequest extends FormRequest
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
             * The email of the account.
             *
             * @example jane@company.com
             */
            'email' => ['required', 'email', 'max:255'],
            /**
             * The 6 digit code received by email.
             *
             * @example 482913
             */
            'code' => ['required', 'string', 'regex:/^\d{6}$/'],
            /**
             * The new password, at least 8 characters.
             *
             * @example a-new-long-password
             */
            'password' => ['required', 'string', Password::min(8)],
        ];
    }
}

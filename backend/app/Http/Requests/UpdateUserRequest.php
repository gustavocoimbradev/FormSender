<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\Role;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

#[SchemaName('UserChanges')]
class UpdateUserRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            /**
             * Email used to log in. Must not be used by another user.
             *
             * @example john@company.com
             */
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            /**
             * A new password, at least 8 characters. Leave it out to keep the current one.
             *
             * @example a-new-long-password
             */
            'password' => ['sometimes', 'nullable', 'string', Password::min(8)],
            /**
             * What the user can do. Only admins can change it, and only the owner can change another admin's role.
             *
             * @example admin
             */
            'role' => ['sometimes', Rule::enum(Role::class)],
        ];
    }
}

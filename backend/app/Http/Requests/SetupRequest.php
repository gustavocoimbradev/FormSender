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
            /**
             * The email server (SMTP) used to deliver messages. Optional: leave it out to keep the current one.
             *
             * @example {"host": "smtp.company.com", "port": 587, "username": "mailer@company.com", "password": "secret", "encryption": "tls", "from_address": "no-reply@company.com", "from_name": "My Company"}
             */
            'smtp' => ['sometimes', 'array'],
            /**
             * Address of the email server.
             *
             * @example smtp.company.com
             */
            'smtp.host' => ['required_with:smtp', 'string', 'max:255'],
            /**
             * Port of the email server (1 to 65535). Usually 465 (SSL), 587 (TLS) or 25.
             *
             * @example 587
             */
            'smtp.port' => ['required_with:smtp', 'integer', 'between:1,65535'],
            /**
             * Login of the email server. Leave empty if it needs none.
             *
             * @example mailer@company.com
             */
            'smtp.username' => ['nullable', 'string', 'max:255'],
            /**
             * Password of the email server.
             *
             * @example secret
             */
            'smtp.password' => ['nullable', 'string', 'max:255'],
            /**
             * Connection security: `ssl`, `tls` or empty for none.
             *
             * @example tls
             */
            'smtp.encryption' => ['nullable', 'in:tls,ssl'],
            /**
             * Address the messages are sent from.
             *
             * @example no-reply@company.com
             */
            'smtp.from_address' => ['required_with:smtp', 'email', 'max:255'],
            /**
             * Name shown as the sender.
             *
             * @example My Company
             */
            'smtp.from_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}

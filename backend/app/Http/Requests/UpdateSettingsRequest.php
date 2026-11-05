<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;

#[SchemaName('SettingsChanges')]
class UpdateSettingsRequest extends FormRequest
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
             * The email server (SMTP) used to deliver messages.
             *
             * @example {"host": "smtp.company.com", "port": 465, "username": "mailer@company.com", "password": "secret", "encryption": "ssl", "from_address": "no-reply@company.com", "from_name": "My Company"}
             */
            'smtp' => ['required', 'array'],
            /**
             * Address of the email server.
             *
             * @example smtp.company.com
             */
            'smtp.host' => ['required', 'string', 'max:255'],
            /**
             * Port of the email server (1 to 65535). Usually 465 (SSL), 587 (TLS) or 25.
             *
             * @example 465
             */
            'smtp.port' => ['required', 'integer', 'between:1,65535'],
            /**
             * Login of the email server. Leave empty if it needs none.
             *
             * @example mailer@company.com
             */
            'smtp.username' => ['nullable', 'string', 'max:255'],
            /**
             * Password of the email server. Leave empty to keep the current one.
             *
             * @example secret
             */
            'smtp.password' => ['nullable', 'string', 'max:255'],
            /**
             * Connection security: `ssl`, `tls` or empty for none.
             *
             * @example ssl
             */
            'smtp.encryption' => ['nullable', 'in:tls,ssl'],
            /**
             * Address the messages are sent from.
             *
             * @example no-reply@company.com
             */
            'smtp.from_address' => ['required', 'email', 'max:255'],
            /**
             * Name shown as the sender.
             *
             * @example My Company
             */
            'smtp.from_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}

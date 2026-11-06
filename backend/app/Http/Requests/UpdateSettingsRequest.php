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
            'smtp' => ['sometimes', 'array'],
            /**
             * Whether anyone can create an account. When `false`, only the administrator creates accounts.
             *
             * @example true
             */
            'allow_registration' => ['sometimes', 'boolean'],
            /**
             * How many days the messages are kept before they are deleted, together with their files (0 to 3650). 0 keeps them forever.
             *
             * @example 90
             */
            'retention_days' => ['sometimes', 'integer', 'between:0,3650'],
            /**
             * The limits for the accounts other than the administrator's. Leave a limit empty for none.
             */
            'quotas' => ['sometimes', 'array'],
            /**
             * How many forms each account can have. The administrator is never limited. Leave empty for no limit.
             *
             * @example 5
             */
            'quotas.max_forms' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            /**
             * How many messages the forms of each account can receive in a day. The administrator is never limited. Leave empty for no limit.
             *
             * @example 100
             */
            'quotas.max_daily_submissions' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            /**
             * Address of the email server.
             *
             * @example smtp.company.com
             */
            'smtp.host' => ['required_with:smtp', 'string', 'max:255'],
            /**
             * Port of the email server (1 to 65535). Usually 465 (SSL), 587 (TLS) or 25.
             *
             * @example 465
             */
            'smtp.port' => ['required_with:smtp', 'integer', 'between:1,65535'],
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

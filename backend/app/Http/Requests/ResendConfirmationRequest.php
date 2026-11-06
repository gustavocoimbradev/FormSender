<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;

#[SchemaName('EmailForConfirmation')]
class ResendConfirmationRequest extends FormRequest
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
             * The email of the account that is waiting to be confirmed.
             *
             * @example jane@company.com
             */
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}

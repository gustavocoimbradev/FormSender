<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;

#[SchemaName('DestinationToConfirm')]
class DestinationToConfirmRequest extends FormRequest
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
             * The destination of the form that is still waiting to confirm.
             *
             * @example team@company.com
             */
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'smtp' => ['required', 'array'],
            'smtp.host' => ['required', 'string', 'max:255'],
            'smtp.port' => ['required', 'integer', 'between:1,65535'],
            'smtp.username' => ['nullable', 'string', 'max:255'],
            'smtp.password' => ['nullable', 'string', 'max:255'],
            'smtp.encryption' => ['nullable', 'in:tls,ssl'],
            'smtp.from_address' => ['required', 'email', 'max:255'],
            'smtp.from_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}

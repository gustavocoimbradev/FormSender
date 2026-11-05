<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Form;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Form
 */
#[SchemaName('Form')]
class FormResource extends JsonResource
{
    /**
     * @return array{id: int, name: string, fields: list<array{name: string, label: string, type: string, required?: bool, options?: list<string>|null}>, destinations: list<string>, allowed_domains: list<string>, token: string, created_at: string|null, updated_at: string|null}
     */
    public function toArray(Request $request): array
    {
        return [
            /** Identifier of the form. */
            'id' => $this->id,
            /** Name of the form. */
            'name' => $this->name,
            /** The fields the form accepts. */
            'fields' => $this->fields,
            /** Email addresses that receive every message. */
            'destinations' => $this->destinations,
            /** Websites allowed to send the form. Empty means any website. */
            'allowed_domains' => $this->allowed_domains,
            /** Secret token the website sends as `Authorization: Bearer <token>` to submit this form. */
            'token' => $this->token,
            /** When the form was created. */
            'created_at' => $this->created_at,
            /** When the form was last changed. */
            'updated_at' => $this->updated_at,
        ];
    }
}

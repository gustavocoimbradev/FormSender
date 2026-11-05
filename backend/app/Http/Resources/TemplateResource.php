<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Template;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Template
 */
#[SchemaName('Template')]
class TemplateResource extends JsonResource
{
    /**
     * @return array{code: string, name: string, subject: string, html: string, is_default: bool, forms_count: int, created_at: string|null, updated_at: string|null}
     */
    public function toArray(Request $request): array
    {
        return [
            /** The template's unique code. */
            'code' => $this->code,
            /** Name of the template. */
            'name' => $this->name,
            /** Subject of the email, with variables. */
            'subject' => $this->subject,
            /** HTML of the email, with variables. */
            'html' => $this->html,
            /** True for the template used by forms that did not choose one. It cannot be deleted. */
            'is_default' => $this->is_default,
            /** How many forms use this template. */
            'forms_count' => (int) ($this->forms_count ?? 0),
            /** When the template was created. */
            'created_at' => $this->created_at,
            /** When the template was last changed. */
            'updated_at' => $this->updated_at,
        ];
    }
}

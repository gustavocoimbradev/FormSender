<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Form;
use Carbon\Carbon;
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
     * @return array{name: string, fields: list<array{name: string, label: string, type: string, required?: bool, options?: list<string>|null}>, destinations: list<string>, allowed_domains: list<string>, redirect_url: string|null, template: string|null, code: string, created_at: Carbon|null, updated_at: Carbon|null}
     */
    public function toArray(Request $request): array
    {
        return [
            /** Name of the form. */
            'name' => $this->name,
            /** The fields the form accepts. */
            'fields' => $this->fields,
            /** Email addresses that receive every message. */
            'destinations' => $this->destinations,
            /** Websites allowed to send the form. Empty means any website. */
            'allowed_domains' => $this->allowed_domains,
            /** Where visitors of a plain HTML page land after sending the form. Empty means they get a short confirmation. */
            'redirect_url' => $this->redirect_url,
            /** Code of the template used for the email, or null when the form uses the default template. */
            'template' => $this->template?->code,
            /** The form's unique code: it identifies the form in every address, here and on the websites that send it. */
            'code' => $this->code,
            /** When the form was created. */
            'created_at' => $this->created_at,
            /** When the form was last changed. */
            'updated_at' => $this->updated_at,
        ];
    }
}

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
     * @return array{name: string, fields: list<array{name: string, label: string, type: string, required?: bool, options?: list<string>|null}>, destinations: list<string>, allowed_domains: list<string>, email_subject: string, email_html: string, email_is_default: bool, css: string, css_is_default: bool, strings: array<string, string>, strings_are_default: bool, code: string, created_at: Carbon|null, updated_at: Carbon|null}
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
            /** Subject of the email delivered for this form's messages (the default one when none was written). */
            'email_subject' => $this->email()['subject'],
            /** HTML body of that email (the default one when none was written). */
            'email_html' => $this->email()['html'],
            /** Whether the form still uses the default email. */
            'email_is_default' => $this->usesDefaultEmail(),
            /** CSS that draws the embedded form (the default style when none was written). */
            'css' => $this->style(),
            /** Whether the form still uses the default style. */
            'css_is_default' => $this->usesDefaultStyle(),
            /** Every text the embedded form shows by itself, by name (the default words for the ones not changed). */
            'strings' => $this->texts(),
            /** Whether the form still uses all the default texts. */
            'strings_are_default' => $this->usesDefaultStrings(),
            /** The form's unique code: it identifies the form in every address, here and on the websites that send it. */
            'code' => $this->code,
            /** When the form was created. */
            'created_at' => $this->created_at,
            /** When the form was last changed. */
            'updated_at' => $this->updated_at,
        ];
    }
}

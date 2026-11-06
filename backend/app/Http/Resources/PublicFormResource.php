<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Form;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * What anyone may know about a form: how to draw it. Nothing about where its messages go.
 *
 * @mixin Form
 */
#[SchemaName('PublicForm')]
class PublicFormResource extends JsonResource
{
    /**
     * @return array{name: string, code: string, css: string, fields: list<array{name: string, label: string, type: string, required: bool, options: list<string>|null}>}
     */
    public function toArray(Request $request): array
    {
        return [
            /** Name of the form. */
            'name' => $this->name,
            /** The form's unique code. */
            'code' => $this->code,
            /** The CSS to draw the form with. */
            'css' => $this->style(),
            /** The fields to draw, in order. */
            'fields' => array_map(fn (array $field): array => [
                /** Technical name of the field: the key sent when submitting. */
                'name' => $field['name'],
                /** Label shown to people. */
                'label' => $field['label'],
                /** Kind of field: `text`, `email`, `phone`, `number`, `textarea`, `select`, `checkbox`, `date` or `file`. */
                'type' => $field['type'],
                /** Whether the visitor must fill it in. */
                'required' => (bool) ($field['required'] ?? false),
                /** The choices of a `select` field. */
                'options' => $field['options'] ?? null,
            ], $this->fields),
        ];
    }
}

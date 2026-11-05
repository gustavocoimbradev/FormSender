<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasPublicCode;
use App\Support\DefaultEmailTemplate;
use Database\Factories\TemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The email that is delivered for a form's messages: a subject and an HTML body
 * written for email clients, with variables like {{form_name}} and {{fields}}.
 */
class Template extends Model
{
    /** @use HasFactory<TemplateFactory> */
    use HasFactory, HasPublicCode;

    protected $fillable = ['name', 'subject', 'html'];

    protected $attributes = ['is_default' => false];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    /**
     * @return HasMany<Form, $this>
     */
    public function forms(): HasMany
    {
        return $this->hasMany(Form::class);
    }

    /**
     * The template used by forms that did not choose one. It always exists: it is created on first use.
     */
    public static function defaultTemplate(): self
    {
        $existing = static::where('is_default', true)->first();

        if ($existing !== null) {
            return $existing;
        }

        $template = new self(['name' => DefaultEmailTemplate::NAME, 'subject' => DefaultEmailTemplate::SUBJECT, 'html' => DefaultEmailTemplate::HTML]);
        $template->forceFill(['is_default' => true])->save();

        return $template;
    }
}

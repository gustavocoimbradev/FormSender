<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Template>
 */
class TemplateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'subject' => 'Nova mensagem: {{form_name}}',
            'html' => '<p>{{fields}}</p>',
        ];
    }
}

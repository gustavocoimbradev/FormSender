<?php

declare(strict_types=1);

use App\Models\Form;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Queue;
use Database\Seeders\ExampleFormSeeder;

it('seeds an example Contact form with a required name and email and an optional message', function (): void {
    $this->seed(ExampleFormSeeder::class);

    $form = Form::sole();

    expect($form->name)->toBe('Contact')
        ->and($form->fields)->toBe([
            ['name' => 'name', 'label' => 'Name', 'type' => 'text', 'required' => true],
            ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'required' => true],
            ['name' => 'message', 'label' => 'Message', 'type' => 'textarea', 'required' => false],
        ])
        ->and($form->destinations)->not->toBe([])
        ->and($form->allowed_domains)->toBe([])
        ->and($form->template_id)->toBeNull();
});

it('seeds it only once, even if it is deleted afterwards', function (): void {
    $this->seed(ExampleFormSeeder::class);
    $this->seed(ExampleFormSeeder::class);

    expect(Form::count())->toBe(1);

    Form::sole()->delete();
    $this->seed(ExampleFormSeeder::class);

    expect(Form::count())->toBe(0);
});

it('does not touch an installation that already has forms of its own', function (): void {
    Form::factory()->create();

    $this->seed(ExampleFormSeeder::class);

    expect(Form::count())->toBe(1)->and(Form::sole()->name)->not->toBe('Contact');
});

it('runs with the database seeder, and the example form can really be submitted', function (): void {
    Queue::fake();
    $this->seed(DatabaseSeeder::class);
    $form = Form::sole();

    $this->postJson("/api/forms/{$form->code}/submit", ['name' => 'Jane', 'email' => 'jane@example.com'])->assertStatus(202);
    $this->postJson("/api/forms/{$form->code}/submit", ['name' => 'Jane'])->assertUnprocessable()->assertJsonValidationErrors('email');
});

<?php

declare(strict_types=1);

use App\Models\Form;
use App\Models\Template;

beforeEach(fn () => actingAsUser());

it('has no template chosen by default (it uses the default one)', function (): void {
    $this->postJson('/api/forms', ['name' => 'Contact'])
        ->assertCreated()
        ->assertJsonPath('data.template', null);
});

it('creates a form with a chosen template, by its code', function (): void {
    $template = Template::factory()->create();

    $this->postJson('/api/forms', ['name' => 'Contact', 'template' => $template->code])
        ->assertCreated()
        ->assertJsonPath('data.template', $template->code);

    expect(Form::sole()->template_id)->toBe($template->id);
});

it('changes the template on update and goes back to the default with null', function (): void {
    $template = Template::factory()->create();
    $form = Form::factory()->create();

    $this->putJson("/api/forms/{$form->code}", ['name' => 'Contact', 'template' => $template->code])
        ->assertOk()
        ->assertJsonPath('data.template', $template->code);

    $this->patchJson("/api/forms/{$form->code}", ['template' => null])
        ->assertOk()
        ->assertJsonPath('data.template', null);

    expect($form->fresh()->template_id)->toBeNull();
});

it('keeps the template when it is not sent', function (): void {
    $template = Template::factory()->create();
    $form = Form::factory()->create(['template_id' => $template->id]);

    $this->patchJson("/api/forms/{$form->code}", ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.template', $template->code);
});

it('refuses a template that does not exist and never accepts a numeric id', function (): void {
    $template = Template::factory()->create();

    $this->postJson('/api/forms', ['name' => 'Contact', 'template' => 'doesnotexist'])->assertUnprocessable()->assertJsonValidationErrors('template');
    $this->postJson('/api/forms', ['name' => 'Contact', 'template' => (string) $template->id])->assertUnprocessable()->assertJsonValidationErrors('template');
});

it('lists the forms with their template code', function (): void {
    $template = Template::factory()->create();
    Form::factory()->create(['template_id' => $template->id]);

    $this->getJson('/api/forms')->assertJsonPath('data.0.template', $template->code);
});

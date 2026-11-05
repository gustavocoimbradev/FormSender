<?php

declare(strict_types=1);

use App\Models\Form;
use App\Models\Template;

beforeEach(fn () => actingAsUser());

function templatePayload(array $overrides = []): array
{
    return ['name' => 'Promocional', 'subject' => 'Nova mensagem de {{form_name}}', 'html' => '<p>{{fields}}</p>', ...$overrides];
}

it('lists the templates with the default first, creating it when missing', function (): void {
    Template::factory()->create(['name' => 'Zeta']);
    Template::factory()->create(['name' => 'Alfa']);

    $response = $this->getJson('/api/templates')->assertOk()->assertJsonCount(3, 'data');

    expect($response->json('data.0.is_default'))->toBeTrue()
        ->and($response->json('data.0.name'))->toBe('Padrão')
        ->and(collect($response->json('data'))->pluck('name')->all())->toBe(['Padrão', 'Alfa', 'Zeta']);
});

it('lists the code, name, subject, html, usage and no numeric id', function (): void {
    $template = Template::factory()->create();
    Form::factory()->count(2)->create(['template_id' => $template->id]);

    $item = collect($this->getJson('/api/templates')->json('data'))->firstWhere('code', $template->code);

    expect($item)->toHaveKeys(['code', 'name', 'subject', 'html', 'is_default', 'forms_count', 'created_at', 'updated_at'])
        ->and($item)->not->toHaveKey('id')
        ->and($item['forms_count'])->toBe(2);
});

it('creates a template with a unique code', function (): void {
    $response = $this->postJson('/api/templates', templatePayload())
        ->assertCreated()
        ->assertJsonPath('data.name', 'Promocional')
        ->assertJsonPath('data.is_default', false);

    expect($response->json('data.code'))->toMatch('/^[a-z0-9]{20}$/');
});

it('shows and updates a template by its code, never the numeric id', function (): void {
    $template = Template::factory()->create();

    $this->getJson("/api/templates/{$template->code}")->assertOk()->assertJsonPath('data.code', $template->code);
    $this->putJson("/api/templates/{$template->code}", templatePayload(['name' => 'Renomeado']))->assertOk()->assertJsonPath('data.name', 'Renomeado');
    $this->patchJson("/api/templates/{$template->code}", ['subject' => 'Só o assunto'])->assertOk()->assertJsonPath('data.subject', 'Só o assunto');

    $this->getJson("/api/templates/{$template->id}")->assertNotFound();
});

it('lets the default template be edited but never deleted', function (): void {
    $default = Template::defaultTemplate();

    $this->putJson("/api/templates/{$default->code}", templatePayload(['name' => 'Padrão']))->assertOk();
    $this->deleteJson("/api/templates/{$default->code}")->assertUnprocessable();

    expect(Template::find($default->id))->not->toBeNull();
});

it('deletes a template, and the forms that used it go back to the default', function (): void {
    $template = Template::factory()->create();
    $form = Form::factory()->create(['template_id' => $template->id]);

    $this->deleteJson("/api/templates/{$template->code}")->assertNoContent();

    expect(Template::find($template->id))->toBeNull()
        ->and($form->fresh()->template_id)->toBeNull();
});

it('validates the template', function (array $overrides, string $errorKey): void {
    $this->postJson('/api/templates', templatePayload($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);
})->with([
    'missing name' => [['name' => null], 'name'],
    'name too long' => [fn () => ['name' => str_repeat('a', 101)], 'name'],
    'missing subject' => [['subject' => null], 'subject'],
    'subject too long' => [fn () => ['subject' => str_repeat('a', 201)], 'subject'],
    'missing html' => [['html' => null], 'html'],
    'html too long' => [fn () => ['html' => str_repeat('a', 100001)], 'html'],
    'script in the html' => [['html' => '<p>x</p><SCRIPT>alert(1)</SCRIPT>'], 'html'],
]);

it('requires a logged in user for every template route', function (): void {
    app('auth')->forgetGuards();
    $template = Template::factory()->create();

    $this->getJson('/api/templates')->assertUnauthorized();
    $this->postJson('/api/templates', templatePayload())->assertUnauthorized();
    $this->getJson("/api/templates/{$template->code}")->assertUnauthorized();
    $this->putJson("/api/templates/{$template->code}", templatePayload())->assertUnauthorized();
    $this->deleteJson("/api/templates/{$template->code}")->assertUnauthorized();
    $this->postJson('/api/templates/preview', templatePayload())->assertUnauthorized();
});

describe('preview', function (): void {
    it('renders the given subject and html with sample data, without saving anything', function (): void {
        $this->postJson('/api/templates/preview', ['subject' => 'Oi {{form_name}}', 'html' => '<h1>{{form_name}}</h1>{{fields}}'])
            ->assertOk()
            ->assertJsonPath('data.subject', 'Oi Formulário de contato')
            ->assertJsonPath('data.html', fn (string $html): bool => str_contains($html, '<h1>Formulário de contato</h1>') && str_contains($html, 'Maria Souza'));

        expect(Template::where('is_default', false)->count())->toBe(0);
    });

    it('validates what it is given', function (): void {
        $this->postJson('/api/templates/preview', ['subject' => 'x'])->assertUnprocessable()->assertJsonValidationErrors('html');
        $this->postJson('/api/templates/preview', ['subject' => 'x', 'html' => '<script>1</script>'])->assertUnprocessable()->assertJsonValidationErrors('html');
    });
});

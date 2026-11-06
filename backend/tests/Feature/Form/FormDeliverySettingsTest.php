<?php

declare(strict_types=1);

use App\Models\Form;

beforeEach(fn () => actingAsAdmin());

function deliveryPayload(array $overrides = []): array
{
    return [
        'name' => 'Contact',
        'fields' => [
            ['name' => 'name', 'label' => 'Name', 'type' => 'text', 'required' => true],
            ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'required' => true],
            ['name' => 'topic', 'label' => 'Topic', 'type' => 'select', 'options' => ['Sales', 'Support']],
        ],
        'destinations' => ['sales@example.com', 'support@example.com'],
        'allowed_domains' => ['example.com', '*.example.org'],
        ...$overrides,
    ];
}

it('creates a form with accepted fields, destinations and allowed domains', function (): void {
    $this->postJson('/api/forms', deliveryPayload())
        ->assertCreated()
        ->assertJsonPath('data.fields.0.name', 'name')
        ->assertJsonPath('data.fields.0.required', true)
        ->assertJsonPath('data.fields.2.options', ['Sales', 'Support'])
        ->assertJsonPath('data.destinations', ['sales@example.com', 'support@example.com'])
        ->assertJsonPath('data.allowed_domains', ['example.com', '*.example.org']);
});

it('defaults fields, destinations and allowed domains to empty lists', function (): void {
    $this->postJson('/api/forms', ['name' => 'Bare'])
        ->assertCreated()
        ->assertJsonPath('data.fields', [])
        ->assertJsonPath('data.destinations', [])
        ->assertJsonPath('data.allowed_domains', []);
});

it('normalizes allowed domains', function (): void {
    $this->postJson('/api/forms', deliveryPayload(['allowed_domains' => ['HTTPS://Example.com/contact', 'www.Site.com:8080', '  *.Example.org ', 'example.com']]))
        ->assertCreated()
        ->assertJsonPath('data.allowed_domains', ['example.com', 'www.site.com', '*.example.org']);
});

it('validates fields, destinations and allowed domains', function (array $overrides, string $errorKey): void {
    $this->postJson('/api/forms', deliveryPayload($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);
})->with([
    'destination not an email' => [['destinations' => ['nope']], 'destinations.0'],
    'duplicated destination' => [['destinations' => ['a@example.com', 'a@example.com']], 'destinations.0'],
    'too many destinations' => [fn () => ['destinations' => array_map(fn ($i) => "u{$i}@example.com", range(1, 21))], 'destinations'],
    'invalid domain' => [['allowed_domains' => ['not a domain']], 'allowed_domains.0'],
    'wildcard in the middle' => [['allowed_domains' => ['a.*.com']], 'allowed_domains.0'],
    'field without name' => [['fields' => [['label' => 'X', 'type' => 'text']]], 'fields.0.name'],
    'field name not snake case' => [['fields' => [['name' => 'Bad Name', 'label' => 'X', 'type' => 'text']]], 'fields.0.name'],
    'duplicated field names' => [['fields' => [['name' => 'a', 'label' => 'A', 'type' => 'text'], ['name' => 'a', 'label' => 'B', 'type' => 'text']]], 'fields.0.name'],
    'field without label' => [['fields' => [['name' => 'a', 'type' => 'text']]], 'fields.0.label'],
    'invalid field type' => [['fields' => [['name' => 'a', 'label' => 'A', 'type' => 'nope']]], 'fields.0.type'],
    'select without options' => [['fields' => [['name' => 'a', 'label' => 'A', 'type' => 'select']]], 'fields.0.options'],
]);

it('updates fields, destinations and allowed domains', function (): void {
    $form = Form::factory()->create();

    $this->putJson("/api/forms/{$form->code}", deliveryPayload(['destinations' => ['new@example.com'], 'allowed_domains' => []]))
        ->assertOk()
        ->assertJsonPath('data.destinations', ['new@example.com'])
        ->assertJsonPath('data.allowed_domains', [])
        ->assertJsonCount(3, 'data.fields');
});

it('updates only the sent attributes on a partial update', function (): void {
    $form = Form::factory()->create(['destinations' => ['keep@example.com']]);

    $this->patchJson("/api/forms/{$form->code}", ['allowed_domains' => ['example.com']])
        ->assertOk()
        ->assertJsonPath('data.destinations', ['keep@example.com'])
        ->assertJsonPath('data.allowed_domains', ['example.com']);
});

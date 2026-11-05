<?php

declare(strict_types=1);

/**
 * @return array<string, mixed>
 */
function openApi(): array
{
    return test()->getJson('/openapi.json')->assertOk()->json();
}

it('serves the interactive documentation at the root of the backend', function (): void {
    $this->get('/')->assertOk();
});

it('describes the api in openapi 3', function (): void {
    $document = openApi();

    expect($document['openapi'])->toStartWith('3.')
        ->and($document['info']['title'])->toBe('FormSender API')
        ->and($document['info']['description'])->not->toBeEmpty();
});

it('documents every api route', function (string $path, string $method): void {
    expect(openApi()['paths'])->toHaveKey($path)
        ->and(openApi()['paths'][$path])->toHaveKey($method);
})->with([
    ['/setup', 'post'],
    ['/auth/login', 'post'],
    ['/auth/logout', 'post'],
    ['/auth/me', 'get'],
    ['/auth/forgot-password', 'post'],
    ['/auth/reset-password', 'post'],
    ['/forms', 'get'],
    ['/forms', 'post'],
    ['/forms/{form}', 'get'],
    ['/forms/{form}', 'put'],
    ['/forms/{form}', 'delete'],
    ['/forms/{form}/token', 'post'],
    ['/forms/{form}/submit', 'post'],
    ['/forms/{form}/submissions', 'get'],
    ['/forms/{form}/submissions/{submission}', 'get'],
    ['/users', 'get'],
    ['/users', 'post'],
    ['/users/{user}', 'put'],
    ['/users/{user}', 'delete'],
    ['/settings', 'get'],
    ['/settings', 'put'],
]);

it('declares bearer authentication for protected routes only', function (): void {
    $document = openApi();

    expect($document['components']['securitySchemes'])->toHaveKey('http');
    expect($document['components']['securitySchemes']['http'])->toMatchArray(['type' => 'http', 'scheme' => 'bearer']);

    foreach ([['/forms', 'get'], ['/settings', 'get'], ['/users', 'get'], ['/auth/me', 'get'], ['/forms/{form}/token', 'post']] as [$path, $method]) {
        expect($document['paths'][$path][$method]['security'] ?? null)->not->toBe([], "{$method} {$path} must be protected");
    }

    foreach ([['/setup', 'post'], ['/auth/login', 'post'], ['/auth/forgot-password', 'post'], ['/auth/reset-password', 'post']] as [$path, $method]) {
        expect($document['paths'][$path][$method]['security'] ?? null)->toBe([], "{$method} {$path} must be public");
    }
});

it('describes the form token authentication of the submit endpoint', function (): void {
    $operation = openApi()['paths']['/forms/{form}/submit']['post'];

    expect($operation['description'] ?? '')->toContain('token')->toContain('allowed domains');
});

it('has a summary for every operation', function (): void {
    foreach (openApi()['paths'] as $path => $operations) {
        foreach ($operations as $method => $operation) {
            expect($operation['summary'] ?? '')->not->toBe('', "{$method} {$path} has no summary");
        }
    }
});

/**
 * Follows a "$ref" to the schema it points to.
 *
 * @param  array<string, mixed>  $schema
 * @return array<string, mixed>
 */
function resolveSchema(array $schema): array
{
    while (isset($schema['$ref'])) {
        $schema = openApi()['components']['schemas'][basename($schema['$ref'])];
    }

    if (isset($schema['allOf'])) {
        $schema = array_merge(...array_map('resolveSchema', $schema['allOf']));
    }

    return $schema;
}

describe('friendly documentation', function (): void {
    it('groups operations under readable names', function (): void {
        $allowed = ['Getting started', 'Authentication', 'Password reset', 'Forms', 'Submitting a form', 'Submissions', 'Users', 'Settings'];

        foreach (openApi()['paths'] as $path => $operations) {
            foreach ($operations as $method => $operation) {
                expect($operation['tags'] ?? [])->toHaveCount(1);
                expect(in_array($operation['tags'][0] ?? null, $allowed, true))->toBeTrue("{$method} {$path} is in an unexpected group");
            }
        }
    });

    it('describes each group', function (): void {
        $tags = collect(openApi()['tags'] ?? [])->keyBy('name');

        foreach (['Getting started', 'Authentication', 'Password reset', 'Forms', 'Submitting a form', 'Submissions', 'Users', 'Settings'] as $group) {
            expect($tags[$group]['description'] ?? '')->not->toBe('', "group {$group} has no description");
        }
    });

    it('uses readable, unique operation ids', function (): void {
        $ids = [];

        foreach (openApi()['paths'] as $operations) {
            foreach ($operations as $operation) {
                expect($operation['operationId'])->toMatch('/^[a-z][A-Za-z]+$/');
                $ids[] = $operation['operationId'];
            }
        }

        expect($ids)->toBe(array_values(array_unique($ids)))
            ->and($ids)->toContain('createForm', 'listForms', 'submitForm', 'logIn', 'saveSettings', 'listSubmissions');
    });

    it('names schemas after business concepts', function (): void {
        $names = array_keys(openApi()['components']['schemas']);

        expect($names)->toContain('Form', 'Submission', 'User', 'Settings');

        foreach ($names as $name) {
            expect($name)->not->toMatch('/(Request|Resource|Controller|Store|Update)/');
        }
    });

    it('does not leak framework jargon', function (): void {
        $text = strtolower((string) json_encode(openApi()));

        foreach (['laravel', 'eloquent', 'sanctum', 'redis', 'jsonresource', 'illuminate', 'controller', 'queue worker'] as $word) {
            expect($text)->not->toContain($word);
        }
    });

    it('explains every input field', function (): void {
        foreach (openApi()['paths'] as $path => $operations) {
            foreach ($operations as $method => $operation) {
                $body = $operation['requestBody']['content']['application/json']['schema'] ?? null;

                foreach (resolveSchema($body ?? [])['properties'] ?? [] as $name => $property) {
                    expect(resolveSchema($property)['description'] ?? $property['description'] ?? '')
                        ->not->toBe('', "{$method} {$path}: field '{$name}' has no description");
                }

                foreach ($operation['parameters'] ?? [] as $parameter) {
                    expect($parameter['description'] ?? '')->not->toBe('', "{$method} {$path}: parameter '{$parameter['name']}' has no description");
                }
            }
        }
    });

    it('shows an example for the main input fields', function (string $schema, string $field): void {
        $property = openApi()['components']['schemas'][$schema]['properties'][$field] ?? [];

        expect($property['examples'] ?? $property['example'] ?? null)->not->toBeNull("{$schema}.{$field} has no example");
    })->with([
        ['Credentials', 'email'],
        ['Credentials', 'password'],
        ['NewForm', 'name'],
        ['NewForm', 'destinations'],
        ['NewForm', 'allowed_domains'],
        ['InitialAdmin', 'email'],
        ['NewUser', 'email'],
        ['SettingsChanges', 'smtp'],
    ]);
});

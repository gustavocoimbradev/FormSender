<?php

declare(strict_types=1);

use App\Models\Form;

it('requires authentication on every protected route', function (string $method, string $uri): void {
    $form = Form::factory()->create();

    $this->json($method, str_replace('{form}', $form->code, $uri))->assertUnauthorized();
})->with([
    ['GET', '/api/forms'],
    ['POST', '/api/forms'],
    ['GET', '/api/forms/{form}'],
    ['PUT', '/api/forms/{form}'],
    ['DELETE', '/api/forms/{form}'],
    ['POST', '/api/email/preview'],
    ['GET', '/api/forms/{form}/style/default'],
    ['GET', '/api/strings/default'],
    ['GET', '/api/forms/{form}/submissions'],
    ['GET', '/api/forms/{form}/submissions/1'],
    ['GET', '/api/settings'],
    ['PUT', '/api/settings'],
    ['GET', '/api/users'],
    ['GET', '/api/auth/me'],
    ['GET', '/api/quotas'],
    ['POST', '/api/auth/logout'],
]);

it('lets regular users manage their own forms', function (): void {
    $user = actingAsUser();
    $form = Form::factory()->for($user)->create();

    $this->getJson('/api/forms')->assertOk();
    $this->postJson('/api/forms', ['name' => 'New'])->assertCreated();
    $this->putJson("/api/forms/{$form->code}", ['name' => 'Changed'])->assertOk();
    $this->deleteJson("/api/forms/{$form->code}")->assertNoContent();
});

it('forbids regular users from reading and changing settings', function (): void {
    actingAsUser();

    $this->getJson('/api/settings')->assertForbidden();
    $this->putJson('/api/settings', [])->assertForbidden();
});

it('lets admins manage forms and settings', function (): void {
    actingAsAdmin();

    $this->getJson('/api/forms')->assertOk();
    $this->getJson('/api/settings')->assertOk();
});

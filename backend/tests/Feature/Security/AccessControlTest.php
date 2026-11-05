<?php

use App\Models\Form;

it('requires authentication on every protected route', function (string $method, string $uri) {
    $form = Form::factory()->create();

    $this->json($method, str_replace('{form}', (string) $form->id, $uri))->assertUnauthorized();
})->with([
    ['GET', '/api/forms'],
    ['POST', '/api/forms'],
    ['GET', '/api/forms/{form}'],
    ['PUT', '/api/forms/{form}'],
    ['DELETE', '/api/forms/{form}'],
    ['GET', '/api/settings'],
    ['PUT', '/api/settings'],
    ['GET', '/api/users'],
    ['GET', '/api/auth/me'],
    ['POST', '/api/auth/logout'],
]);

it('lets regular users manage forms', function () {
    actingAsUser();
    $form = Form::factory()->create();

    $this->getJson('/api/forms')->assertOk();
    $this->postJson('/api/forms', ['name' => 'New'])->assertCreated();
    $this->putJson("/api/forms/{$form->id}", ['name' => 'Changed'])->assertOk();
    $this->deleteJson("/api/forms/{$form->id}")->assertNoContent();
});

it('forbids regular users from reading and changing settings', function () {
    actingAsUser();

    $this->getJson('/api/settings')->assertForbidden();
    $this->putJson('/api/settings', [])->assertForbidden();
});

it('lets admins manage forms and settings', function () {
    actingAsAdmin();

    $this->getJson('/api/forms')->assertOk();
    $this->getJson('/api/settings')->assertOk();
});

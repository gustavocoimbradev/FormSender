<?php

declare(strict_types=1);

use App\Models\Form;
use App\Models\User;

it('gives a new form to the person who created it', function (): void {
    $user = actingAsUser();

    $code = $this->postJson('/api/forms', ['name' => 'Mine'])->assertCreated()->json('data.code');

    expect(Form::where('code', $code)->firstOrFail()->user_id)->toBe($user->id);
});

it('lists only the forms of the person logged in', function (): void {
    $user = actingAsUser();
    $mine = Form::factory()->for($user)->create();
    Form::factory()->for(User::factory()->create())->create();

    $this->getJson('/api/forms')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.code', $mine->code);
});

it('lets the administrator see and list every form', function (): void {
    actingAsAdmin();
    Form::factory()->for(User::factory()->create())->create();
    Form::factory()->for(User::factory()->create())->create();

    $this->getJson('/api/forms')->assertOk()->assertJsonCount(2, 'data');
});

it('hides the forms of others from a regular user', function (string $method, string $uri): void {
    actingAsUser();
    $form = Form::factory()->for(User::factory()->create())->create();
    $submission = submissionFor($form);

    $this->json($method, str_replace(['{form}', '{submission}'], [$form->code, (string) $submission->id], $uri), ['name' => 'Changed'])->assertForbidden();
})->with([
    ['GET', '/api/forms/{form}'],
    ['PUT', '/api/forms/{form}'],
    ['DELETE', '/api/forms/{form}'],
    ['GET', '/api/forms/{form}/style/default'],
    ['GET', '/api/forms/{form}/submissions'],
    ['GET', '/api/forms/{form}/submissions/{submission}'],
    ['POST', '/api/forms/{form}/submissions/{submission}/retry'],
]);

it('lets the administrator open and change the form of anyone', function (): void {
    actingAsAdmin();
    $form = Form::factory()->for(User::factory()->create())->create();

    $this->getJson("/api/forms/{$form->code}")->assertOk();
    $this->putJson("/api/forms/{$form->code}", ['name' => 'By admin'])->assertOk();
    $this->getJson("/api/forms/{$form->code}/submissions")->assertOk();
});

it('deletes the forms of a person together with the account', function (): void {
    actingAsAdmin();
    $user = User::factory()->create();
    $form = Form::factory()->for($user)->create();

    $this->deleteJson("/api/users/{$user->id}")->assertNoContent();

    expect(Form::find($form->id))->toBeNull();
});

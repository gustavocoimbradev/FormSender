<?php

declare(strict_types=1);

use App\Models\Form;
use Illuminate\Support\Facades\DB;

beforeEach(fn () => actingAsUser());

it('generates a secure token for each new form', function (): void {
    $first = $this->postJson('/api/forms', ['name' => 'One'])->assertCreated()->json('data.token');
    $second = $this->postJson('/api/forms', ['name' => 'Two'])->assertCreated()->json('data.token');

    expect($first)->toStartWith('fs_')->toHaveLength(51)
        ->and($second)->toStartWith('fs_')
        ->and($first)->not->toBe($second);
});

it('returns the token when showing and listing forms', function (): void {
    $form = Form::factory()->create();

    $this->getJson("/api/forms/{$form->id}")->assertJsonPath('data.token', $form->token);
    $this->getJson('/api/forms')->assertJsonPath('data.0.token', $form->token);
});

it('stores the token encrypted', function (): void {
    $form = Form::factory()->create();

    $raw = DB::table('forms')->where('id', $form->id)->value('token');

    expect($raw)->not->toBe($form->token)->and($raw)->not->toContain('fs_');
});

it('ignores a token sent by the client', function (): void {
    $token = $this->postJson('/api/forms', ['name' => 'One', 'token' => 'fs_chosen-by-client'])->json('data.token');

    expect($token)->not->toBe('fs_chosen-by-client');
});

it('keeps the token when the form is updated', function (): void {
    $form = Form::factory()->create();

    $this->putJson("/api/forms/{$form->id}", ['name' => 'Renamed', 'token' => 'fs_hacked'])
        ->assertOk()
        ->assertJsonPath('data.token', $form->token);
});

it('rotates the token', function (): void {
    $form = Form::factory()->create();
    $old = $form->token;

    $new = $this->postJson("/api/forms/{$form->id}/token")
        ->assertOk()
        ->json('data.token');

    expect($new)->toStartWith('fs_')->not->toBe($old)
        ->and($form->fresh()->token)->toBe($new);
});

it('keeps a unique hash of the token and refreshes it on rotation', function (): void {
    $form = Form::factory()->create();
    $other = Form::factory()->create();

    expect(DB::table('forms')->where('id', $form->id)->value('token_hash'))->toBe(hash('sha256', $form->token))
        ->and($form->fresh()->token_hash)->not->toBe($other->fresh()->token_hash);

    $new = $this->postJson("/api/forms/{$form->id}/token")->json('data.token');

    expect(DB::table('forms')->where('id', $form->id)->value('token_hash'))->toBe(hash('sha256', $new));
});

it('never repeats a token already in use', function (): void {
    $taken = Form::factory()->create();
    $form = Form::factory()->create();

    mt_srand(1);
    foreach (range(1, 20) as $i) {
        $this->postJson("/api/forms/{$form->id}/token")->assertOk();
    }

    expect(Form::pluck('token_hash')->unique()->count())->toBe(2);
});

it('returns 404 when rotating the token of an unknown form', function (): void {
    $this->postJson('/api/forms/999/token')->assertNotFound();
});

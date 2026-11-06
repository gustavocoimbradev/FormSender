<?php

declare(strict_types=1);

use App\Models\Form;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(fn () => actingAsAdmin());

it('gives every new form a unique public code', function (): void {
    $first = $this->postJson('/api/forms', ['name' => 'One'])->assertCreated()->json('data.code');
    $second = $this->postJson('/api/forms', ['name' => 'Two'])->assertCreated()->json('data.code');

    expect($first)->toMatch('/^[a-z][a-z0-9]{19}$/')
        ->and($second)->toMatch('/^[a-z][a-z0-9]{19}$/')
        ->and($first)->not->toBe($second);
});

it('never repeats a code, and codes do not follow the id', function (): void {
    Form::factory()->count(30)->create();

    $codes = Form::orderBy('id')->pluck('code');

    expect($codes->unique())->toHaveCount(30)
        ->and($codes->every(fn (string $code): bool => (string) (int) $code !== $code))->toBeTrue();
});

it('returns the code and no token when showing and listing forms', function (): void {
    $form = Form::factory()->create();

    $this->getJson("/api/forms/{$form->code}")
        ->assertJsonPath('data.code', $form->code)
        ->assertJsonMissingPath('data.token');

    $this->getJson('/api/forms')
        ->assertJsonPath('data.0.code', $form->code)
        ->assertJsonMissingPath('data.0.token');
});

it('ignores a code sent by the client', function (): void {
    $code = $this->postJson('/api/forms', ['name' => 'One', 'code' => 'chosen-by-client'])->json('data.code');

    expect($code)->not->toBe('chosen-by-client');
});

it('keeps the code when the form is updated', function (): void {
    $form = Form::factory()->create();

    $this->putJson("/api/forms/{$form->code}", ['name' => 'Renamed', 'code' => 'hacked'])
        ->assertOk()
        ->assertJsonPath('data.code', $form->code);
});

it('has no bearer token anymore', function (): void {
    $form = Form::factory()->create();

    expect(Schema::hasColumn('forms', 'token'))->toBeFalse()
        ->and(Schema::hasColumn('forms', 'token_hash'))->toBeFalse();

    $this->postJson("/api/forms/{$form->code}/token")->assertNotFound();
});

it('uses the code, never the numeric id, in every form address', function (): void {
    $form = Form::factory()->create();

    $this->getJson("/api/forms/{$form->id}")->assertNotFound();
    $this->putJson("/api/forms/{$form->id}", ['name' => 'X'])->assertNotFound();
    $this->deleteJson("/api/forms/{$form->id}")->assertNotFound();
    $this->getJson("/api/forms/{$form->id}/submissions")->assertNotFound();

    $this->getJson("/api/forms/{$form->code}")->assertOk();
    $this->getJson("/api/forms/{$form->code}/submissions")->assertOk();
});

it('does not expose the numeric id of a form', function (): void {
    Form::factory()->create();

    $this->getJson('/api/forms')->assertJsonMissingPath('data.0.id');
});

it('stores the code in a unique column', function (): void {
    $form = Form::factory()->create();

    expect(DB::table('forms')->where('id', $form->id)->value('code'))->toBe($form->code);

    expect(fn () => DB::table('forms')->insert(['name' => 'Dup', 'code' => $form->code, 'created_at' => now(), 'updated_at' => now()]))
        ->toThrow(QueryException::class);
});

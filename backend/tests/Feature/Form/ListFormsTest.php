<?php

declare(strict_types=1);

beforeEach(fn () => actingAsAdmin());

use App\Models\Form;

it('lists forms paginated, newest first', function (): void {
    $older = Form::factory()->create(['name' => 'Older']);
    $newer = Form::factory()->create(['name' => 'Newer']);

    $this->getJson('/api/forms')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.code', $newer->code)
        ->assertJsonPath('data.1.code', $older->code)
        ->assertJsonStructure(['data', 'links', 'meta']);
});

it('returns an empty list when there are no forms', function (): void {
    $this->getJson('/api/forms')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

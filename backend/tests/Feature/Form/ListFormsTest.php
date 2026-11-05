<?php

use App\Models\Form;

it('lists forms paginated, newest first', function () {
    $older = Form::factory()->create(['name' => 'Older']);
    $newer = Form::factory()->create(['name' => 'Newer']);

    $this->getJson('/api/forms')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.1.id', $older->id)
        ->assertJsonStructure(['data', 'links', 'meta']);
});

it('returns an empty list when there are no forms', function () {
    $this->getJson('/api/forms')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

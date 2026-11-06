<?php

declare(strict_types=1);

use App\Models\FormSubmission;
use App\Models\Setting;

it('starts from the value of the environment: nothing is deleted', function (): void {
    actingAsAdmin();

    $this->getJson('/api/settings')->assertOk()->assertJsonPath('data.retention_days', 0);
});

it('follows the environment until a period is saved in the panel', function (): void {
    actingAsAdmin();
    config(['formsender.submission_retention_days' => 60]);

    $this->getJson('/api/settings')->assertJsonPath('data.retention_days', 60);
});

it('saves how long the messages are kept', function (): void {
    actingAsAdmin();

    $this->putJson('/api/settings', ['retention_days' => 90])->assertOk()->assertJsonPath('data.retention_days', 90);
    $this->getJson('/api/settings')->assertJsonPath('data.retention_days', 90);
});

it('lets the panel go back to keeping everything, whatever the environment says', function (): void {
    actingAsAdmin();
    config(['formsender.submission_retention_days' => 60]);

    $this->putJson('/api/settings', ['retention_days' => 0])->assertOk()->assertJsonPath('data.retention_days', 0);
});

it('does not touch the other settings', function (): void {
    actingAsAdmin();
    configureSmtp();

    $this->putJson('/api/settings', ['retention_days' => 30])->assertOk()->assertJsonPath('data.smtp.host', 'smtp.example.com');
});

it('refuses a value that is not a number of days', function (mixed $value): void {
    actingAsAdmin();

    $this->putJson('/api/settings', ['retention_days' => $value])->assertUnprocessable()->assertJsonValidationErrors('retention_days');
})->with(['negative' => -1, 'text' => 'forever', 'decimal' => 1.5, 'too long' => 5000]);

it('is only for the administrator', function (): void {
    actingAsUser();

    $this->putJson('/api/settings', ['retention_days' => 30])->assertForbidden();
});

it('deletes messages by the period saved in the panel', function (): void {
    Setting::create(['key' => 'retention', 'value' => ['days' => 30]]);
    $old = submissionFromDaysAgo(31);
    $recent = submissionFromDaysAgo(29);

    $this->artisan('model:prune', ['--model' => FormSubmission::class])->assertSuccessful();

    expect(FormSubmission::find($old->id))->toBeNull()
        ->and(FormSubmission::find($recent->id))->not->toBeNull();
});

it('keeps everything when the panel says so, even if the environment sets a period', function (): void {
    config(['formsender.submission_retention_days' => 30]);
    Setting::create(['key' => 'retention', 'value' => ['days' => 0]]);
    submissionFromDaysAgo(4000);

    $this->artisan('model:prune', ['--model' => FormSubmission::class])->assertSuccessful();

    expect(FormSubmission::count())->toBe(1);
});

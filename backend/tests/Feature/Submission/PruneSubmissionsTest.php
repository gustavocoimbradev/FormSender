<?php

declare(strict_types=1);

use App\Actions\Submission\StoreFormSubmissionAction;
use App\Models\FormSubmission;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('removes submissions older than the retention period', function (): void {
    config(['formsender.submission_retention_days' => 30]);
    $old = submissionFromDaysAgo(31);
    $recent = submissionFromDaysAgo(29);

    $this->artisan('model:prune', ['--model' => FormSubmission::class])->assertSuccessful();

    expect(FormSubmission::find($old->id))->toBeNull()
        ->and(FormSubmission::find($recent->id))->not->toBeNull();
});

it('keeps everything when the retention period is zero', function (): void {
    config(['formsender.submission_retention_days' => 0]);
    submissionFromDaysAgo(4000);

    $this->artisan('model:prune', ['--model' => FormSubmission::class])->assertSuccessful();

    expect(FormSubmission::count())->toBe(1);
});

it('never deletes anything unless a retention period is set', function (): void {
    submissionFromDaysAgo(4000);

    $this->artisan('model:prune', ['--model' => FormSubmission::class])->assertSuccessful();

    expect(config('formsender.submission_retention_days'))->toBe(0)
        ->and(FormSubmission::count())->toBe(1);
});

it('deletes the attachments of a pruned submission', function (): void {
    Storage::fake('local');
    config(['formsender.submission_retention_days' => 30]);
    $form = contactForm(['fields' => [['name' => 'brief', 'label' => 'Brief', 'type' => 'file']]]);
    $submission = app(StoreFormSubmissionAction::class)->execute($form, ['brief' => UploadedFile::fake()->create('brief.pdf', 10, 'application/pdf')]);
    $submission->forceFill(['created_at' => now()->subDays(40)])->save();
    $path = $submission->attachments[0]['path'];
    Storage::disk('local')->assertExists($path);

    $this->artisan('model:prune', ['--model' => FormSubmission::class])->assertSuccessful();

    Storage::disk('local')->assertMissing($path);
});

it('runs the pruning every day', function (): void {
    $commands = collect(app(Schedule::class)->events())->pluck('command')->implode(' ');

    expect($commands)->toContain('model:prune');
});

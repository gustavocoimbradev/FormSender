<?php

declare(strict_types=1);

use App\Actions\Submission\StoreFormSubmissionAction;
use App\Mail\FormSubmissionMail;
use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

function quoteForm(bool $required = false): Form
{
    return contactForm(['fields' => [
        ['name' => 'name', 'label' => 'Name', 'type' => 'text', 'required' => true],
        ['name' => 'brief', 'label' => 'Brief', 'type' => 'file', 'required' => $required],
    ]]);
}

function pdf(string $name = 'brief.pdf', int $kilobytes = 100): UploadedFile
{
    return UploadedFile::fake()->create($name, $kilobytes, 'application/pdf');
}

beforeEach(function (): void {
    Storage::fake('local');
    Queue::fake();
    configureSmtp();
});

it('accepts a file, keeps it out of the public data and queues the delivery', function (): void {
    $form = quoteForm();

    $this->post("/api/forms/{$form->code}/submit", ['name' => 'Jane', 'brief' => pdf()], ['Accept' => 'application/json'])
        ->assertStatus(202);

    $submission = FormSubmission::sole();
    $attachment = $submission->attachments[0];

    expect($submission->attachments)->toHaveCount(1)
        ->and($attachment['field'])->toBe('brief')
        ->and($attachment['name'])->toBe('brief.pdf')
        ->and($attachment['mime'])->toBe('application/pdf')
        ->and($attachment['size'])->toBeGreaterThan(0)
        ->and($attachment['code'])->toBeString()
        ->and($submission->data['brief'])->toBe('brief.pdf');
    Storage::disk('local')->assertExists($attachment['path']);
});

it('accepts a form without the optional file', function (): void {
    $form = quoteForm();

    $this->postJson("/api/forms/{$form->code}/submit", ['name' => 'Jane'])->assertStatus(202);

    expect(FormSubmission::sole()->attachments)->toBe([]);
});

it('requires the file when the field is required', function (): void {
    $form = quoteForm(required: true);

    $this->postJson("/api/forms/{$form->code}/submit", ['name' => 'Jane'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('brief');
});

it('rejects a file bigger than the limit', function (): void {
    config(['formsender.attachments.max_kilobytes' => 1024]);
    $form = quoteForm();

    $this->post("/api/forms/{$form->code}/submit", ['name' => 'Jane', 'brief' => pdf(kilobytes: 2048)], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('brief');

    expect(Storage::disk('local')->allFiles())->toBe([]);
});

it('rejects a file type that is not allowed', function (string $name, string $mime): void {
    $form = quoteForm();

    $this->post("/api/forms/{$form->code}/submit", ['name' => 'Jane', 'brief' => UploadedFile::fake()->create($name, 10, $mime)], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('brief');
})->with([
    ['virus.exe', 'application/x-msdownload'],
    ['page.php', 'application/x-httpd-php'],
    ['script.html', 'text/html'],
]);

it('rejects text sent where a file is expected', function (): void {
    $form = quoteForm();

    $this->postJson("/api/forms/{$form->code}/submit", ['name' => 'Jane', 'brief' => 'not a file'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('brief');
});

it('stores nothing for a bot', function (): void {
    $form = quoteForm();

    $this->post("/api/forms/{$form->code}/submit", ['name' => 'Jane', '_gotcha' => 'x', 'brief' => pdf()], ['Accept' => 'application/json'])
        ->assertStatus(202);

    expect(FormSubmission::sole()->attachments)->toBe([])
        ->and(Storage::disk('local')->allFiles())->toBe([]);
});

it('attaches the files to the email', function (): void {
    $submission = app(StoreFormSubmissionAction::class)->execute(quoteForm(), ['name' => 'Jane', 'brief' => pdf('Quote request.pdf')]);

    $attachments = (new FormSubmissionMail($submission, 'no-reply@example.com'))->attachments();

    expect($attachments)->toHaveCount(1)
        ->and($attachments[0]->as)->toBe('Quote request.pdf')
        ->and($attachments[0]->mime)->toBe('application/pdf');
});

it('lists the attachments of a submission without their storage path', function (): void {
    actingAsUser();
    $form = quoteForm();
    $submission = app(StoreFormSubmissionAction::class)->execute($form, ['name' => 'Jane', 'brief' => pdf()]);

    $response = $this->getJson("/api/forms/{$form->code}/submissions/{$submission->id}")->assertOk();

    expect($response->json('data.attachments.0'))->toHaveKeys(['code', 'field', 'name', 'size', 'mime'])
        ->and($response->json('data.attachments.0'))->not->toHaveKey('path');
});

it('downloads an attachment for a logged in user', function (): void {
    actingAsUser();
    $form = quoteForm();
    $submission = app(StoreFormSubmissionAction::class)->execute($form, ['name' => 'Jane', 'brief' => pdf()]);
    $code = $submission->attachments[0]['code'];

    $this->get("/api/forms/{$form->code}/submissions/{$submission->id}/attachments/{$code}")
        ->assertOk()
        ->assertDownload('brief.pdf');
});

it('does not download an attachment without a login', function (): void {
    $form = quoteForm();
    $submission = app(StoreFormSubmissionAction::class)->execute($form, ['name' => 'Jane', 'brief' => pdf()]);
    $code = $submission->attachments[0]['code'];

    $this->getJson("/api/forms/{$form->code}/submissions/{$submission->id}/attachments/{$code}")->assertUnauthorized();
});

it('answers not found for an unknown attachment', function (): void {
    actingAsUser();
    $form = quoteForm();
    $submission = app(StoreFormSubmissionAction::class)->execute($form, ['name' => 'Jane', 'brief' => pdf()]);

    $this->getJson("/api/forms/{$form->code}/submissions/{$submission->id}/attachments/nope")->assertNotFound();
});

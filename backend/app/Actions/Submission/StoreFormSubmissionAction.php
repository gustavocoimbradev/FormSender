<?php

declare(strict_types=1);

namespace App\Actions\Submission;

use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class StoreFormSubmissionAction
{
    /**
     * Saves the submission with a snapshot of the form (name, fields and
     * destinations), so the record stays meaningful even if the form changes
     * or is deleted later. Uploaded files go to private storage; the message
     * keeps only their original names as the field values.
     *
     * @param  array<string, mixed>  $data
     * @param  array{ip?: ?string, origin?: ?string, user_agent?: ?string}  $meta
     */
    public function execute(Form $form, array $data, array $meta = []): FormSubmission
    {
        $files = array_filter($data, fn (mixed $value): bool => $value instanceof UploadedFile);
        $values = array_map(
            fn (mixed $value): mixed => $value instanceof UploadedFile ? $this->safeName($value) : $value,
            $data,
        );

        $destinations = $form->confirmedDestinations();

        return DB::transaction(function () use ($form, $destinations, $values, $files, $meta): FormSubmission {
            $submission = FormSubmission::create([
                'form_id' => $form->id,
                'form_name' => $form->name,
                'fields' => $form->fields,
                'data' => $values,
                'destinations' => $destinations,
                'deliveries' => array_map(
                    fn (string $destination): array => [
                        'destination' => $destination,
                        'status' => 'pending',
                        'error' => null,
                        'sent_at' => null,
                    ],
                    $destinations,
                ),
                'ip' => $meta['ip'] ?? null,
                'origin' => $meta['origin'] ?? null,
                'user_agent' => $meta['user_agent'] ?? null,
            ]);

            if ($files !== []) {
                try {
                    $submission->update(['attachments' => $this->storeFiles($submission, $files)]);
                } catch (Throwable $exception) {
                    $submission->deleteAttachments();

                    throw $exception;
                }
            }

            return $submission;
        });
    }

    /**
     * @param  array<string, UploadedFile>  $files
     * @return list<array{code: string, field: string, name: string, path: string, size: int, mime: string}>
     */
    private function storeFiles(FormSubmission $submission, array $files): array
    {
        $disk = Storage::disk(config('formsender.attachments.disk'));
        $attachments = [];

        foreach ($files as $field => $file) {
            $path = $disk->putFile(FormSubmission::attachmentsDirectory($submission->id), $file);

            $attachments[] = [
                'code' => Str::lower(Str::random(16)),
                'field' => (string) $field,
                'name' => $this->safeName($file),
                'path' => (string) $path,
                'size' => (int) $file->getSize(),
                'mime' => (string) $file->getMimeType(),
            ];
        }

        return $attachments;
    }

    /**
     * The name the visitor's file had, without anything that could break a header or a path.
     */
    private function safeName(UploadedFile $file): string
    {
        $name = Str::limit((string) preg_replace('/[\x00-\x1F\x7F\/\\\\]/', '', $file->getClientOriginalName()), 150, '');

        return $name === '' ? 'attachment' : $name;
    }
}

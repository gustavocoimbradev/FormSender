<?php

declare(strict_types=1);

namespace App\Actions\Submission;

use App\Enums\SubmissionStatus;
use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Support\Str;

class RecordSpamSubmissionAction
{
    /**
     * Keeps what a bot sent (only the fields the form accepts, unvalidated and trimmed) so it can be
     * reviewed under Messages. It is never queued and never emailed.
     *
     * @param  array<string, mixed>  $input
     * @param  array{ip?: ?string, origin?: ?string, user_agent?: ?string}  $meta
     */
    public function execute(Form $form, array $input, array $meta = []): FormSubmission
    {
        $data = [];

        foreach (array_keys($form->submissionRules()) as $name) {
            if (isset($input[$name]) && is_scalar($input[$name])) {
                $data[$name] = Str::limit((string) $input[$name], 5000, '');
            }
        }

        return FormSubmission::create([
            'form_id' => $form->id,
            'form_name' => $form->name,
            'fields' => $form->fields,
            'data' => $data,
            'destinations' => [],
            'deliveries' => [],
            'status' => SubmissionStatus::Spam,
            'processed_at' => now(),
            'ip' => $meta['ip'] ?? null,
            'origin' => $meta['origin'] ?? null,
            'user_agent' => $meta['user_agent'] ?? null,
        ]);
    }
}

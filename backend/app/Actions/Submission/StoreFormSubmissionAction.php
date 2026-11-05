<?php

declare(strict_types=1);

namespace App\Actions\Submission;

use App\Models\Form;
use App\Models\FormSubmission;

class StoreFormSubmissionAction
{
    /**
     * Saves the submission with a snapshot of the form (name, fields and
     * destinations), so the record stays meaningful even if the form changes
     * or is deleted later.
     *
     * @param  array<string, mixed>  $data
     * @param  array{ip?: ?string, origin?: ?string, user_agent?: ?string}  $meta
     */
    public function execute(Form $form, array $data, array $meta = []): FormSubmission
    {
        return FormSubmission::create([
            'form_id' => $form->id,
            'form_name' => $form->name,
            'fields' => $form->fields,
            'data' => $data,
            'destinations' => $form->destinations,
            'deliveries' => array_map(
                fn (string $destination): array => [
                    'destination' => $destination,
                    'status' => 'pending',
                    'error' => null,
                    'sent_at' => null,
                ],
                $form->destinations,
            ),
            'ip' => $meta['ip'] ?? null,
            'origin' => $meta['origin'] ?? null,
            'user_agent' => $meta['user_agent'] ?? null,
        ]);
    }
}

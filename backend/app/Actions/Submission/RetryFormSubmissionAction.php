<?php

declare(strict_types=1);

namespace App\Actions\Submission;

use App\Enums\SubmissionStatus;
use App\Jobs\SendFormSubmission;
use App\Models\FormSubmission;

class RetryFormSubmissionAction
{
    /**
     * Queues a stuck submission again. Destinations that already received it are skipped by the job.
     */
    public function execute(FormSubmission $submission): FormSubmission
    {
        abort_unless(
            in_array($submission->status, [SubmissionStatus::Failed, SubmissionStatus::Partial], true),
            422,
            'Only messages that failed to be delivered can be retried.',
        );

        $submission->update(['status' => SubmissionStatus::Pending, 'error' => null, 'processed_at' => null]);

        SendFormSubmission::dispatch($submission);

        return $submission;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Submission\RetryFormSubmissionAction;
use App\Http\Resources\FormSubmissionResource;
use App\Models\Form;
use App\Models\FormSubmission;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

#[Group('Submissions', description: 'Every message a form receives is kept here, with its delivery status for each destination.', weight: 6)]
class RetrySubmissionController extends Controller
{
    /**
     * Retry a message that failed.
     *
     * Puts a message whose delivery `failed` (or only reached some destinations, `partial`) back in the queue.
     * Destinations that already received it are not emailed again. Any other message answers 422.
     */
    #[Endpoint(operationId: 'retrySubmission')]
    public function __invoke(Form $form, FormSubmission $submission, RetryFormSubmissionAction $retrySubmission): JsonResponse
    {
        Gate::authorize('update', $form);

        return (new FormSubmissionResource($retrySubmission->execute($submission)))
            ->response()
            ->setStatusCode(202);
    }
}

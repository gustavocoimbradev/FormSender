<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use App\Enums\SubmissionStatus;
use App\Http\Resources\FormSubmissionResource;
use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

#[Group('Submissions', description: 'Every message a form receives is kept here, with its delivery status for each destination.', weight: 6)]
class FormSubmissionController extends Controller
{
    /**
     * List the submissions of a form.
     *
     * Newest first, paginated, with the processing status and the delivery result of each destination. Filter with `status`.
     */
    #[Endpoint(operationId: 'listSubmissions')]
    #[QueryParameter('status', description: 'Only show submissions in this delivery status: `pending`, `processing`, `sent`, `partial`, `failed` or `spam` (caught by the hidden `_gotcha` field and never sent).', required: false, type: 'string', example: 'failed')]
    public function index(Request $request, Form $form): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::enum(SubmissionStatus::class)],
        ]);

        return FormSubmissionResource::collection(
            $form->submissions()
                ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
                ->latest('id')
                ->paginate(),
        );
    }

    /**
     * Get a submission.
     */
    #[Endpoint(operationId: 'getSubmission')]
    public function show(Form $form, FormSubmission $submission): FormSubmissionResource
    {
        return new FormSubmissionResource($submission);
    }
}

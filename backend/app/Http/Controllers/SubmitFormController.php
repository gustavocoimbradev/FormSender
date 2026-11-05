<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Actions\Submission\StoreFormSubmissionAction;
use App\Jobs\SendFormSubmission;
use App\Models\Form;
use App\Models\Setting;
use App\Support\RequestHost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

#[Group('Submitting a form', description: 'The endpoint your website calls when a visitor sends the form. It uses the form token, not a user login.', weight: 5)]
class SubmitFormController extends Controller
{
    /**
     * Submit a form.
     *
     * Called by the visitor's browser or by any server. Authenticate with the **form's own token**:
     * `Authorization: Bearer <form token>`. When the form lists allowed domains, the `Origin` (or
     * `Referer`) header must match one of them, otherwise the answer is 403.
     *
     * Only the fields the form accepts are validated and kept. The submission is saved and queued, and
     * the answer is an instant `202`; the email delivery happens in the background. Limited to 20
     * requests per minute per form and IP.
     */
    #[Endpoint(operationId: 'submitForm')]
    public function __invoke(Request $request, Form $form, StoreFormSubmissionAction $storeSubmission): JsonResponse
    {
        $data = $request->validate($form->submissionRules());

        abort_if($form->destinations === [], 422, 'This form has no destinations configured.');
        abort_unless(Setting::where('key', 'smtp')->exists(), 503, 'Email delivery is not configured.');

        $submission = $storeSubmission->execute($form, $data, [
            'ip' => $request->ip(),
            'origin' => RequestHost::from($request),
            'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
        ]);

        SendFormSubmission::dispatch($submission);

        return response()->json([
            'message' => 'Your message was received and will be delivered shortly.',
            'data' => ['id' => $submission->id, 'status' => $submission->status->value],
        ], 202);
    }
}

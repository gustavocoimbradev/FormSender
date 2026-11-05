<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Submission\StoreFormSubmissionAction;
use App\Jobs\SendFormSubmission;
use App\Models\Form;
use App\Models\Setting;
use App\Support\RequestHost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubmitFormController extends Controller
{
    /**
     * Token and domain were already checked by AuthorizeFormSubmission.
     * The submission is saved and queued; the SMTP delivery happens in the worker.
     */
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

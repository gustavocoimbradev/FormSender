<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Submission\ReceiveFormSubmissionAction;
use App\Models\Form;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

#[Group('Forms', description: 'A form defines which fields it accepts, where its messages are delivered (destinations), which websites may send it and its own public code.', weight: 4)]
class TestFormController extends Controller
{
    /**
     * Send a test message.
     *
     * Sends a message through the form the way a visitor would, but from the dashboard: it does not
     * depend on the allowed domains, because it is an action of a logged in user. It is validated,
     * saved and delivered to the destinations like any other message, and shows up in the form's
     * messages with the origin `dashboard`.
     */
    #[Endpoint(operationId: 'sendTestMessage')]
    public function __invoke(Request $request, Form $form, ReceiveFormSubmissionAction $receiveSubmission): JsonResponse
    {
        $submission = $receiveSubmission->execute($form, $request->validate($form->submissionRules()), [
            'ip' => $request->ip(),
            'origin' => 'dashboard',
            'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
        ]);

        return response()->json([
            'message' => 'The test message was received and will be delivered shortly.',
            'data' => ['id' => $submission->id, 'status' => $submission->status->value],
        ], 202);
    }
}

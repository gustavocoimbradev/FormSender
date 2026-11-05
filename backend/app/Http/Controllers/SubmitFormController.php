<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Actions\Submission\ReceiveFormSubmissionAction;
use App\Actions\Submission\RecordSpamSubmissionAction;
use App\Models\Form;
use App\Support\RequestHost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

#[Group('Submitting a form', description: 'The endpoint your website calls when a visitor sends the form. No login and no token: only the sites allowed on the form can send it.', weight: 5)]
class SubmitFormController extends Controller
{
    /** The hidden field bots fill in and people never see. */
    private const HONEYPOT = '_gotcha';

    /**
     * Submit a form.
     *
     * Called straight from the website's page: no login and no token. The form is found by its public
     * `code` (the numeric id does not work). When the form lists allowed domains, the `Origin` (or
     * `Referer`) of the request must match one of them, otherwise the answer is 403; an empty list
     * lets any site send the form.
     *
     * Every form has a built-in honeypot: add a hidden field named `_gotcha` to the page (people never see
     * or fill it, bots do). When it arrives filled, the answer is the same `202`, but nothing is sent: the
     * message is only kept under Messages with the status `spam`. Leave it empty (or omit it) for real visitors.
     *
     * Only the fields the form accepts are validated and kept. The submission is saved and queued, and
     * the answer is an instant `202`; the email delivery happens in the background. Limited to 20
     * requests per minute per form and IP.
     */
    #[Endpoint(operationId: 'submitForm')]
    public function __invoke(Request $request, Form $form, ReceiveFormSubmissionAction $receiveSubmission, RecordSpamSubmissionAction $recordSpam): JsonResponse
    {
        $meta = [
            'ip' => $request->ip(),
            'origin' => RequestHost::from($request),
            'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
        ];

        // A bot gets the very same answer as a person: it must never learn it was caught.
        if ($request->filled(self::HONEYPOT)) {
            return $this->received($recordSpam->execute($form, $request->all(), $meta)->id, 'pending');
        }

        $submission = $receiveSubmission->execute($form, $request->validate($form->submissionRules()), $meta);

        return $this->received($submission->id, $submission->status->value);
    }

    private function received(int $id, string $status): JsonResponse
    {
        return response()->json([
            'message' => 'Your message was received and will be delivered shortly.',
            'data' => ['id' => $id, 'status' => $status],
        ], 202);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormSubmission;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

#[Group('Submissions', description: 'Every message a form receives is kept here, with its delivery status for each destination.', weight: 6)]
class SubmissionAttachmentController extends Controller
{
    /**
     * Download an attachment.
     *
     * Returns the file a visitor sent through a `file` field, with its original name. The `attachment` is
     * the code listed in the `attachments` of the message.
     *
     * @param  string  $attachment  Code of the file, as listed in the `attachments` of the message.
     */
    #[Endpoint(operationId: 'downloadAttachment')]
    public function __invoke(Form $form, FormSubmission $submission, string $attachment): StreamedResponse
    {
        $file = $submission->attachment($attachment);

        abort_if($file === null, 404);

        return Storage::disk(config('formsender.attachments.disk'))->download($file['path'], $file['name'], ['Content-Type' => $file['mime']]);
    }
}

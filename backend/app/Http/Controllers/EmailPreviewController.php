<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\PreviewEmailRequest;
use App\Support\EmailTemplateRenderer;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Email', description: 'The email delivered for a form is written in the form itself: a subject and an HTML body made for email clients, with variables that are filled in with each message. These endpoints help while writing it.', weight: 5)]
class EmailPreviewController extends Controller
{
    /**
     * Preview an email.
     *
     * Fills the given subject and HTML with example answers, exactly as a real message would be, without saving anything.
     *
     * @response array{data: array{subject: string, html: string}}
     */
    #[Endpoint(operationId: 'previewEmail')]
    public function __invoke(PreviewEmailRequest $request, EmailTemplateRenderer $renderer): JsonResponse
    {
        return response()->json(['data' => $renderer->renderSample((string) $request->validated('subject'), $request->validated('html'), $request->validated('fields'))]);
    }
}

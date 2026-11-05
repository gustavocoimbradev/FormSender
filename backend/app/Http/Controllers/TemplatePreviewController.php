<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\PreviewTemplateRequest;
use App\Support\EmailTemplateRenderer;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Templates')]
class TemplatePreviewController extends Controller
{
    /**
     * Preview a template.
     *
     * Fills the given subject and HTML with example data, exactly as a real message would be, without saving anything.
     *
     * @response array{data: array{subject: string, html: string}}
     */
    #[Endpoint(operationId: 'previewTemplate')]
    public function __invoke(PreviewTemplateRequest $request, EmailTemplateRenderer $renderer): JsonResponse
    {
        return response()->json(['data' => $renderer->renderSample((string) $request->validated('subject'), $request->validated('html'))]);
    }
}

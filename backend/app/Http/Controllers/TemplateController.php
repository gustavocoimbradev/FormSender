<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreTemplateRequest;
use App\Http\Requests\UpdateTemplateRequest;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

#[Group('Templates', description: 'A template is the email delivered for a form: a subject and an HTML body made for email clients, with variables that are filled in with each message.', weight: 5)]
class TemplateController extends Controller
{
    /**
     * List templates.
     *
     * The default template comes first, then the others by name. The default one is created when missing.
     */
    #[Endpoint(operationId: 'listTemplates')]
    public function index(): AnonymousResourceCollection
    {
        Template::defaultTemplate();

        return TemplateResource::collection(
            Template::withCount('forms')->orderByDesc('is_default')->orderBy('name')->get(),
        );
    }

    /**
     * Create a template.
     *
     * Variables available in the subject and the body: `{{form_name}}`, `{{date}}`, `{{origin}}`, `{{ip}}`,
     * `{{fields}}` (the answers not already placed one by one, in a styled table, body only), `{{field.NAME}}` and `{{label.NAME}}` for a single field. Wrap content in `{{#field.NAME}}...{{/field.NAME}}` to show it only when that field has a value.
     */
    #[Endpoint(operationId: 'createTemplate')]
    public function store(StoreTemplateRequest $request): TemplateResource
    {
        return new TemplateResource(Template::create($request->validated())->loadCount('forms'));
    }

    /**
     * Get a template.
     */
    #[Endpoint(operationId: 'getTemplate')]
    public function show(Template $template): TemplateResource
    {
        return new TemplateResource($template->loadCount('forms'));
    }

    /**
     * Update a template.
     *
     * `PUT` replaces the template; `PATCH` changes only the attributes sent.
     */
    #[Endpoint(operationId: 'updateTemplate')]
    public function update(UpdateTemplateRequest $request, Template $template): TemplateResource
    {
        $template->update($request->validated());

        return new TemplateResource($template->loadCount('forms'));
    }

    /**
     * Delete a template.
     *
     * The forms that used it go back to the default template. The default template cannot be deleted.
     */
    #[Endpoint(operationId: 'deleteTemplate')]
    public function destroy(Template $template): Response|JsonResponse
    {
        if ($template->is_default) {
            return response()->json(['message' => 'The default template cannot be deleted.'], 422);
        }

        $template->delete();

        return response()->noContent();
    }
}

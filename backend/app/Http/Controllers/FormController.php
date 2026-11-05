<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Http\Requests\StoreFormRequest;
use App\Http\Requests\UpdateFormRequest;
use App\Http\Resources\FormResource;
use App\Models\Form;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

#[Group('Forms', description: 'A form defines which fields it accepts, where its messages are delivered (destinations), which websites may send it and its own public code.', weight: 4)]
class FormController extends Controller
{
    /**
     * List forms.
     *
     * Newest first, paginated.
     */
    #[Endpoint(operationId: 'listForms')]
    public function index(): AnonymousResourceCollection
    {
        return FormResource::collection(Form::with('template')->latest('id')->paginate());
    }

    /**
     * Create a form.
     *
     * Defines the accepted `fields`, the email `destinations` (up to 20) and the `allowed_domains`
     * (hosts such as `example.com` or `*.example.com`; empty means any domain). A unique public
     * `code` is generated automatically. Domains are normalized: scheme, path, port and case are removed.
     */
    #[Endpoint(operationId: 'createForm')]
    public function store(StoreFormRequest $request): FormResource
    {
        return new FormResource(Form::create($request->validatedForForm())->load('template'));
    }

    /**
     * Get a form.
     *
     * Includes its public code.
     */
    #[Endpoint(operationId: 'getForm')]
    public function show(Form $form): FormResource
    {
        return new FormResource($form->load('template'));
    }

    /**
     * Update a form.
     *
     * `PUT` replaces the form; `PATCH` changes only the attributes sent.
     */
    #[Endpoint(operationId: 'updateForm')]
    public function update(UpdateFormRequest $request, Form $form): FormResource
    {
        $form->update($request->validatedForForm());

        return new FormResource($form->load('template'));
    }

    /**
     * Delete a form.
     *
     * Its submissions are kept for auditing, detached from the form.
     */
    #[Endpoint(operationId: 'deleteForm')]
    public function destroy(Form $form): Response
    {
        $form->delete();

        return response()->noContent();
    }
}

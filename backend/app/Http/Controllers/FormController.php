<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Form\SyncFormDestinationsAction;
use App\Http\Requests\StoreFormRequest;
use App\Http\Requests\UpdateFormRequest;
use App\Http\Resources\FormResource;
use App\Models\Form;
use App\Support\AccountQuotas;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

#[Group('Forms', description: 'A form defines which fields it accepts, where its messages are delivered (destinations), which websites may send it and its own public code.', weight: 4)]
class FormController extends Controller
{
    /**
     * List forms.
     *
     * Newest first, paginated. A person sees their own forms; the administrator sees every form.
     */
    #[Endpoint(operationId: 'listForms')]
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        return FormResource::collection(
            Form::query()
                ->unless($user->isAdmin(), fn ($query) => $query->whereBelongsTo($user))
                ->latest('id')
                ->paginate(),
        );
    }

    /**
     * Create a form.
     *
     * Defines the accepted `fields`, the email `destinations` (up to 20) and the `allowed_domains`
     * (hosts such as `example.com` or `*.example.com`; empty means any domain). The form belongs to the person who creates it. Each destination of an account's form gets an email to confirm it wants the messages; until then it receives nothing. A unique public
     * `code` is generated automatically. When the administrator limits how many forms an account can have, going past it answers 403. Domains are normalized: scheme, path, port and case are removed.
     */
    #[Endpoint(operationId: 'createForm')]
    public function store(StoreFormRequest $request, SyncFormDestinationsAction $syncDestinations): FormResource
    {
        abort_if(
            AccountQuotas::formsReached($request->user()),
            403,
            'You reached the limit of '.AccountQuotas::maxForms().' forms. Delete one to create another.',
        );

        $form = $request->user()->forms()->create($request->validated());
        $form->setRelation('user', $request->user());

        $syncDestinations->execute($form);

        return new FormResource($form);
    }

    /**
     * Get a form.
     *
     * Includes its public code.
     */
    #[Endpoint(operationId: 'getForm')]
    public function show(Form $form): FormResource
    {
        Gate::authorize('view', $form);

        return new FormResource($form);
    }

    /**
     * Update a form.
     *
     * `PUT` replaces the form; `PATCH` changes only the attributes sent.
     */
    #[Endpoint(operationId: 'updateForm')]
    public function update(UpdateFormRequest $request, Form $form, SyncFormDestinationsAction $syncDestinations): FormResource
    {
        Gate::authorize('update', $form);

        $previousDestinations = $form->destinations;

        $form->update($request->validated());

        $syncDestinations->execute($form, $previousDestinations);

        return new FormResource($form);
    }

    /**
     * Delete a form.
     *
     * Its submissions are kept for auditing, detached from the form.
     */
    #[Endpoint(operationId: 'deleteForm')]
    public function destroy(Form $form): Response
    {
        Gate::authorize('delete', $form);

        $form->delete();

        return response()->noContent();
    }
}

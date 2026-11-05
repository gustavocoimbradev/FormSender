<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreFormRequest;
use App\Http\Requests\UpdateFormRequest;
use App\Http\Resources\FormResource;
use App\Models\Form;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class FormController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FormResource::collection(Form::latest('id')->paginate());
    }

    public function store(StoreFormRequest $request): FormResource
    {
        return new FormResource(Form::create($request->validated()));
    }

    public function show(Form $form): FormResource
    {
        return new FormResource($form);
    }

    public function update(UpdateFormRequest $request, Form $form): FormResource
    {
        $form->update($request->validated());

        return new FormResource($form);
    }

    public function destroy(Form $form): Response
    {
        $form->delete();

        return response()->noContent();
    }

    /**
     * Replaces the form's token with a new unique one; the old token stops working.
     */
    public function regenerateToken(Form $form): FormResource
    {
        $form->regenerateToken();
        $form->save();

        return new FormResource($form);
    }
}

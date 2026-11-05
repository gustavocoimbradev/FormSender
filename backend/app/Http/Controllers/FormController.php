<?php

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
}

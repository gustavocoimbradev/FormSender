<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\SubmissionStatus;
use App\Http\Resources\FormSubmissionResource;
use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class FormSubmissionController extends Controller
{
    public function index(Request $request, Form $form): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::enum(SubmissionStatus::class)],
        ]);

        return FormSubmissionResource::collection(
            $form->submissions()
                ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
                ->latest('id')
                ->paginate(),
        );
    }

    public function show(Form $form, FormSubmission $submission): FormSubmissionResource
    {
        return new FormSubmissionResource($submission);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Form;
use App\Support\DefaultFormStyle;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

#[Group('Forms', description: 'A form defines which fields it accepts, where its messages are delivered (destinations), which websites may send it and its own public code.', weight: 4)]
class DefaultStyleController extends Controller
{
    /**
     * Get the default style of a form.
     *
     * The CSS the form is drawn with until its own style is written (the `css` of the form). Every element of the embedded
     * form is found by an id that starts with the form's code, which is why the style is made for each form. Useful to go back to it.
     *
     * @response array{data: array{css: string}}
     */
    #[Endpoint(operationId: 'getDefaultStyle')]
    public function __invoke(Form $form): JsonResponse
    {
        Gate::authorize('view', $form);

        return response()->json(['data' => ['css' => DefaultFormStyle::for($form->code)]]);
    }
}

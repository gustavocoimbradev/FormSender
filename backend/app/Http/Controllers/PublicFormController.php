<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\PublicFormResource;
use App\Models\Form;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;

#[Group('Submitting a form', description: 'The endpoint your website calls when a visitor sends the form. No login and no token: only the sites allowed on the form can send it.', weight: 5)]
class PublicFormController extends Controller
{
    /**
     * Get a form to draw.
     *
     * The name and the fields of a form, so a page can draw it (this is what the embed script of the dashboard
     * does, which is why an edited form changes on every site at once). No login and no token: the same sites
     * allowed to send the form can read it, and nothing about where its messages go is given.
     */
    #[Endpoint(operationId: 'getPublicForm')]
    public function __invoke(Form $form): PublicFormResource
    {
        return new PublicFormResource($form);
    }
}

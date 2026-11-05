<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Actions\Setup\CreateInitialAdminAction;
use App\Http\Requests\SetupRequest;
use App\Http\Resources\UserResource;

#[Group('Getting started', description: 'Create the first administrator account. This is done once, when FormSender is installed.', weight: 1)]
class SetupController extends Controller
{
    /**
     * Create the initial admin account.
     *
     * Only works while no admin exists (HTTP 403 afterwards). The created account is the *owner*:
     * the admin that can later change or remove other admins. `name` defaults to "Admin".
     */
    #[Endpoint(operationId: 'createInitialAdmin')]
    public function __invoke(SetupRequest $request, CreateInitialAdminAction $createInitialAdmin): UserResource
    {
        return new UserResource($createInitialAdmin->execute($request->validated()));
    }
}

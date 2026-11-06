<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Setup\CreateInitialAdminAction;
use App\Enums\Role;
use App\Http\Requests\SetupRequest;
use App\Http\Resources\UserResource;
use App\Models\Setting;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;

#[Group('Getting started', description: 'Create the first administrator account. This is done once, when FormSender is installed.', weight: 1)]
class SetupController extends Controller
{
    /**
     * Check whether the setup was already done.
     *
     * Lets a dashboard decide whether to show the first-time setup screen. `completed` becomes true
     * as soon as an administrator exists, and `registration_open` tells whether anyone can create an account
     * (so a login screen knows whether to offer it). Nothing else about the accounts is revealed.
     *
     * @return array{data: array{completed: bool, registration_open: bool}}
     */
    #[Endpoint(operationId: 'getSetupStatus')]
    public function status(): array
    {
        return ['data' => ['completed' => User::where('role', Role::Admin)->exists(), 'registration_open' => Setting::registrationOpen()]];
    }

    /**
     * Create the initial admin account.
     *
     * Only works while no admin exists (HTTP 403 afterwards). The created account is the *owner*:
     * the admin that can later change or remove other admins. `name` defaults to "Admin". The email
     * server (`smtp`) can be saved right here, in the same step; if it is wrong nothing is created. `allow_registration` chooses whether anyone can create an
     * account (closed unless asked).
     */
    #[Endpoint(operationId: 'createInitialAdmin')]
    public function __invoke(SetupRequest $request, CreateInitialAdminAction $createInitialAdmin): UserResource
    {
        return new UserResource($createInitialAdmin->execute($request->validated()));
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Auth\RegisterAccountAction;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;

#[Group('Users', description: 'People who can sign in to the dashboard. Admin only.', weight: 7)]
class UserController extends Controller
{
    /**
     * List users.
     *
     * Admin only.
     */
    #[Endpoint(operationId: 'listUsers')]
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);

        return UserResource::collection(User::orderBy('name')->paginate());
    }

    /**
     * Create a user.
     *
     * Admin only, and it works even while new accounts are not allowed. The account is always a regular user (it sees
     * and manages only its own forms) and, like any other, it cannot log in until its email is confirmed with the link
     * that is sent there.
     */
    #[Endpoint(operationId: 'createUser')]
    public function store(StoreUserRequest $request, RegisterAccountAction $registerAccount): UserResource
    {
        Gate::authorize('create', User::class);

        return new UserResource($registerAccount->execute($request->validated()));
    }

    /**
     * Get a user.
     *
     * Admin only.
     */
    #[Endpoint(operationId: 'getUser')]
    public function show(User $user): UserResource
    {
        Gate::authorize('view', $user);

        return new UserResource($user);
    }

    /**
     * Update a user.
     *
     * Admin only. A new password revokes the user's tokens. `PATCH` changes only the attributes sent.
     */
    #[Endpoint(operationId: 'updateUser')]
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        Gate::authorize('update', $user);

        $data = $request->validated();

        $user->fill(Arr::except($data, 'password'));

        if (filled($data['password'] ?? null)) {
            $user->password = $data['password'];
            $user->tokens()->delete();
        }

        $user->save();

        return new UserResource($user);
    }

    /**
     * Delete a user.
     *
     * Admin only. The administrator cannot delete their own account. The user's forms are deleted with the account.
     */
    #[Endpoint(operationId: 'deleteUser')]
    public function destroy(User $user): Response
    {
        Gate::authorize('delete', $user);

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }
}

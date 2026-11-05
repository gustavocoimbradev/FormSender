<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Enums\Role;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
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
     * Admin only. `role` defaults to `user`.
     */
    #[Endpoint(operationId: 'createUser')]
    public function store(StoreUserRequest $request): UserResource
    {
        Gate::authorize('create', User::class);

        $user = new User(Arr::except($request->validated(), 'role'));
        $user->role = Role::from($request->validated('role', Role::User->value));
        $user->save();

        return new UserResource($user);
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
     * Admin only. Admins edit regular users and themselves; only the owner edits other admins. Changing a
     * role follows the same rule, nobody changes their own role or the owner's, and a new password revokes
     * the user's tokens. `PATCH` changes only the attributes sent.
     */
    #[Endpoint(operationId: 'updateUser')]
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        Gate::authorize('update', $user);

        $data = $request->validated();

        if (isset($data['role']) && Role::from($data['role']) !== $user->role) {
            Gate::authorize('changeRole', $user);
            $user->role = Role::from($data['role']);
        }

        $user->fill(Arr::except($data, ['role', 'password']));

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
     * Admin only. Nobody deletes themselves or the owner; only the owner deletes other admins.
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

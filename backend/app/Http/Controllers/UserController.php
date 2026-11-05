<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);

        return UserResource::collection(User::orderBy('name')->paginate());
    }

    public function store(StoreUserRequest $request): UserResource
    {
        Gate::authorize('create', User::class);

        $user = new User(Arr::except($request->validated(), 'role'));
        $user->role = Role::from($request->validated('role', Role::User->value));
        $user->save();

        return new UserResource($user);
    }

    public function show(User $user): UserResource
    {
        Gate::authorize('view', $user);

        return new UserResource($user);
    }

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

    public function destroy(User $user): Response
    {
        Gate::authorize('delete', $user);

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }
}

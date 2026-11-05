<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

#[Group('Authentication', description: 'Log in to get an access token, then send it in every request as `Authorization: Bearer <token>`.', weight: 2)]
class AuthController extends Controller
{
    /**
     * Log in.
     *
     * Returns an API token to send as `Authorization: Bearer <token>`. Tokens expire after 8 hours.
     * Wrong email and wrong password give the same error, and attempts are limited to 5 per minute.
     *
     * @unauthenticated
     *
     * @return array{token: string, data: array<string, mixed>}
     */
    #[Endpoint(operationId: 'logIn')]
    public function login(LoginRequest $request): array
    {
        if (! Auth::validate($request->only('email', 'password'))) {
            throw ValidationException::withMessages(['email' => [trans('auth.failed')]]);
        }

        $user = User::where('email', $request->string('email')->toString())->firstOrFail();

        return [
            'token' => $user->createToken('api')->plainTextToken,
            'data' => (new UserResource($user))->resolve(),
        ];
    }

    /**
     * Get the authenticated user.
     */
    #[Endpoint(operationId: 'getCurrentUser')]
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * Log out.
     *
     * Revokes only the token used in this request.
     */
    #[Endpoint(operationId: 'logOut')]
    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @return array{token: string, data: array<string, mixed>}
     */
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

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}

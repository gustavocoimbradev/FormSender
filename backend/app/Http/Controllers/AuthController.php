<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): array
    {
        if (! Auth::validate($request->only('email', 'password'))) {
            throw ValidationException::withMessages(['email' => [trans('auth.failed')]]);
        }

        $user = \App\Models\User::where('email', $request->email)->firstOrFail();

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

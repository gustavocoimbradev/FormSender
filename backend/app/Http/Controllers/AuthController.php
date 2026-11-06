<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Auth\RegisterAccountAction;
use App\Actions\Auth\ResendAccountConfirmationAction;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResendConfirmationRequest;
use App\Http\Resources\UserResource;
use App\Models\Setting;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

#[Group('Authentication', description: 'Create an account, confirm your email and log in to get an access token, then send it in every request as `Authorization: Bearer <token>`.', weight: 2)]
class AuthController extends Controller
{
    /**
     * Create an account.
     *
     * Only while the administrator allows new accounts (otherwise 403). The account is a regular one: it creates and
     * sees only its own forms. A link to confirm the email is sent, and the account cannot log in until it is used.
     * Limited to 5 requests per minute.
     *
     * @unauthenticated
     */
    #[Endpoint(operationId: 'createAccount')]
    public function register(RegisterRequest $request, RegisterAccountAction $registerAccount): JsonResponse
    {
        abort_unless(Setting::registrationOpen(), 403, 'New accounts are not allowed here.');

        $registerAccount->execute($request->validated());

        return response()->json(['message' => 'Account created. Open the link we emailed you to confirm it.'], 202);
    }

    /**
     * Send the confirmation email again.
     *
     * For an account that was created but not confirmed yet. The answer is always the same, whether or not the
     * email belongs to such an account, and a new email is sent at most once a minute.
     *
     * @unauthenticated
     */
    #[Endpoint(operationId: 'resendConfirmation')]
    public function resendConfirmation(ResendConfirmationRequest $request, ResendAccountConfirmationAction $resendConfirmation): JsonResponse
    {
        $resendConfirmation->execute($request->string('email')->toString());

        return response()->json(['message' => 'If the account is waiting to be confirmed, a new link is on its way.'], 202);
    }

    /**
     * Log in.
     *
     * Returns an API token to send as `Authorization: Bearer <token>`. Tokens expire after 8 hours.
     * Wrong email and wrong password give the same error, and attempts are limited to 5 per minute.
     * An account whose email was not confirmed yet answers 403 with `code` set to `email_unconfirmed`.
     *
     * @unauthenticated
     *
     * @response array{token: string, data: array<string, mixed>}
     */
    #[Endpoint(operationId: 'logIn')]
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::validate($request->only('email', 'password'))) {
            throw ValidationException::withMessages(['email' => [trans('auth.failed')]]);
        }

        $user = User::where('email', $request->string('email')->toString())->firstOrFail();

        if ($user->email_verified_at === null) {
            return response()->json(['message' => 'Confirm your email first: open the link we sent you.', 'code' => 'email_unconfirmed'], 403);
        }

        return response()->json([
            'token' => $user->createToken('api')->plainTextToken,
            'data' => (new UserResource($user))->resolve(),
        ]);
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

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Actions\Auth\RequestPasswordResetAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;

#[Group('Password reset', description: 'Forgot your password? Ask for a 6 digit code by email and use it to choose a new password.', weight: 3)]
class PasswordResetController extends Controller
{
    /**
     * Request a password reset code.
     *
     * Sends a 6 digit code by email (valid for 15 minutes). The answer is always the same,
     * whether or not the email belongs to an account.
     *
     * @unauthenticated
     */
    #[Endpoint(operationId: 'requestResetCode')]
    public function forgot(ForgotPasswordRequest $request, RequestPasswordResetAction $requestReset): JsonResponse
    {
        $requestReset->execute($request->string('email')->toString());

        return response()->json(['message' => 'If the email belongs to an account, a reset code is on its way.'], 202);
    }

    /**
     * Reset the password with the emailed code.
     *
     * The code is single use, expires after 15 minutes and is locked after 5 wrong attempts.
     * All API tokens of the user are revoked.
     *
     * @unauthenticated
     */
    #[Endpoint(operationId: 'resetPassword')]
    public function reset(ResetPasswordRequest $request, ResetPasswordAction $resetPassword): JsonResponse
    {
        $resetPassword->execute(
            $request->string('email')->toString(),
            $request->string('code')->toString(),
            $request->string('password')->toString(),
        );

        return response()->json(['message' => 'Password updated. You can now log in.']);
    }
}

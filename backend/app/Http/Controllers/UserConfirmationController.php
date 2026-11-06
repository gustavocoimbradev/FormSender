<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Auth\ResendAccountConfirmationAction;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

#[Group('Users', description: 'People who can sign in to the dashboard. Admin only.', weight: 7)]
class UserConfirmationController extends Controller
{
    /**
     * Send the confirmation link again.
     *
     * Admin only. Sends a new link to the email of an account that was not confirmed yet (the old link stops working).
     * An account that is already confirmed answers 422.
     */
    #[Endpoint(operationId: 'resendUserConfirmation')]
    public function __invoke(User $user, ResendAccountConfirmationAction $resendConfirmation): JsonResponse
    {
        Gate::authorize('update', $user);

        if ($user->email_verified_at !== null) {
            throw ValidationException::withMessages(['email' => ['This email is already confirmed.']]);
        }

        $resendConfirmation->execute($user->email);

        return response()->json(['message' => 'A new link is on its way.'], 202);
    }
}

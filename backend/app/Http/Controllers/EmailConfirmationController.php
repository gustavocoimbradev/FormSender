<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Auth\ConfirmEmailAction;
use App\Http\Requests\ConfirmEmailRequest;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Authentication', description: 'Create an account, confirm your email and log in to get an access token, then send it in every request as `Authorization: Bearer <token>`.', weight: 2)]
class EmailConfirmationController extends Controller
{
    /**
     * Confirm an email.
     *
     * Uses the token from the link that came by email. It confirms the account, once: the link stops working after
     * it is used or after 48 hours. A wrong, used or expired token answers 422.
     *
     * @unauthenticated
     *
     * @response array{data: array{type: string, email: string}}
     */
    #[Endpoint(operationId: 'confirmEmail')]
    public function __invoke(ConfirmEmailRequest $request, ConfirmEmailAction $confirmEmail): JsonResponse
    {
        $confirmation = $confirmEmail->execute($request->string('token')->toString());

        return response()->json(['data' => ['type' => 'account', 'email' => $confirmation->email]]);
    }
}

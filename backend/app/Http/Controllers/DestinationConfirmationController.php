<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Form\SyncFormDestinationsAction;
use App\Http\Requests\DestinationToConfirmRequest;
use App\Models\EmailConfirmation;
use App\Models\Form;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

#[Group('Forms', description: 'A form defines which fields it accepts, where its messages are delivered (destinations), which websites may send it and its own public code.', weight: 4)]
class DestinationConfirmationController extends Controller
{
    /**
     * Ask a destination to confirm again.
     *
     * Sends a new link to a destination of the form that is still waiting to confirm (the old link stops working).
     * An address that is already confirmed, or is not a destination of the form, answers 422, and a new email goes
     * to the same address at most once a minute (429).
     */
    #[Endpoint(operationId: 'resendDestinationConfirmation')]
    public function __invoke(DestinationToConfirmRequest $request, Form $form, SyncFormDestinationsAction $syncDestinations): JsonResponse
    {
        Gate::authorize('update', $form);

        $address = collect($form->pendingDestinations())->first(fn (string $destination): bool => strcasecmp($destination, $request->string('email')->toString()) === 0);

        if ($address === null) {
            throw ValidationException::withMessages(['email' => ['This address is not waiting for a confirmation.']]);
        }

        $last = EmailConfirmation::where('form_id', $form->id)->where('email', $address)->latest('created_at')->first();

        abort_if($last !== null && $last->created_at->gt(now()->subSeconds(EmailConfirmation::COOLDOWN_SECONDS)), 429, 'A link was sent a moment ago. Wait a minute and try again.');

        $syncDestinations->ask($form, $address);

        return response()->json(['message' => 'A new link is on its way.'], 202);
    }
}

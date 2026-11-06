<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Jobs\SendEmailConfirmation;
use App\Models\EmailConfirmation;
use App\Models\User;

class ResendAccountConfirmationAction
{
    /**
     * Sends a new link to an account that is still waiting. Does nothing for unknown or already confirmed
     * emails, or when one was sent a moment ago, so the answer never reveals which accounts exist.
     */
    public function execute(string $email): void
    {
        $user = User::where('email', $email)->whereNull('email_verified_at')->first();

        if ($user === null) {
            return;
        }

        $last = EmailConfirmation::where('user_id', $user->id)->latest('created_at')->first();

        if ($last !== null && $last->created_at->gt(now()->subSeconds(EmailConfirmation::COOLDOWN_SECONDS))) {
            return;
        }

        SendEmailConfirmation::dispatch(
            $user->email,
            EmailConfirmation::issue($user->email, $user),
            'Confirm your FormSender account',
            'Confirm your email to start creating forms.',
        );
    }
}

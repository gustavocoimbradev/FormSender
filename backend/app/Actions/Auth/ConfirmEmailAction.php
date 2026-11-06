<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Models\EmailConfirmation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmEmailAction
{
    /**
     * Uses a token received by email: it confirms the account, once. A wrong, used or expired token is refused.
     */
    public function execute(string $token): EmailConfirmation
    {
        $confirmation = EmailConfirmation::findByToken($token)
            ?? throw ValidationException::withMessages(['token' => ['This link is not valid anymore. Ask for a new one.']]);

        DB::transaction(function () use ($confirmation): void {
            $confirmation->user?->forceFill(['email_verified_at' => now()])->save();

            $confirmation->delete();
        });

        return $confirmation;
    }
}

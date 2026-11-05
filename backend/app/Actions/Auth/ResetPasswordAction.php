<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ResetPasswordAction
{
    public const MAX_ATTEMPTS = 5;

    /**
     * @throws ValidationException when the code is wrong, expired, used up or the email is unknown (same error for all)
     */
    public function execute(string $email, string $code, string $password): void
    {
        $record = PasswordResetCode::where('email', $email)->first();
        $user = User::where('email', $email)->first();

        $usable = $record !== null
            && $user !== null
            && $record->expires_at->isFuture()
            && $record->attempts < self::MAX_ATTEMPTS;

        // Always do one hash operation, so timing does not reveal whether the email exists.
        $matches = Hash::check($code, $usable ? $record->code_hash : Hash::make(Str::random(32)));

        if ($usable && ! $matches) {
            $record->increment('attempts');
        }

        if (! $usable || ! $matches) {
            throw ValidationException::withMessages(['code' => ['The code is invalid or has expired.']]);
        }

        DB::transaction(function () use ($user, $record, $password): void {
            $user->password = $password;
            $user->save();
            $user->tokens()->delete();
            $record->delete();
        });
    }
}

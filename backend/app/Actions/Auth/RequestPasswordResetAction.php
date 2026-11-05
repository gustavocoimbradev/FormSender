<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Jobs\SendPasswordResetCode;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RequestPasswordResetAction
{
    public const CODE_TTL_MINUTES = 15;

    public const COOLDOWN_SECONDS = 60;

    /**
     * Issues a 6 digit code and queues the email. Does nothing for unknown
     * emails, so the response never reveals which accounts exist.
     */
    public function execute(string $email): void
    {
        $user = User::where('email', $email)->first();

        if ($user === null) {
            return;
        }

        $existing = PasswordResetCode::where('email', $email)->first();

        if ($existing !== null && $existing->created_at->gt(now()->subSeconds(self::COOLDOWN_SECONDS))) {
            return;
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($email, $code): void {
            PasswordResetCode::where('email', $email)->delete();

            PasswordResetCode::create([
                'email' => $email,
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
            ]);
        });

        SendPasswordResetCode::dispatch($user->email, $code);
    }
}

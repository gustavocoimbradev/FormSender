<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
#[SchemaName('User')]
class UserResource extends JsonResource
{
    /**
     * @return array{id: int, name: string, email: string, role: string, email_confirmed: bool, created_at: Carbon|null, updated_at: Carbon|null}
     */
    public function toArray(Request $request): array
    {
        return [
            /** Identifier of the user. */
            'id' => $this->id,
            /** Full name. */
            'name' => $this->name,
            /** Email used to log in. */
            'email' => $this->email,
            /** `admin` for the administrator who installed it (who sees every form and manages the accounts), `user` for everyone else. */
            'role' => $this->role->value,
            /** Whether the email was confirmed with the link that was sent to it. Until then the account cannot log in. */
            'email_confirmed' => $this->email_verified_at !== null,
            /** When the user was created. */
            'created_at' => $this->created_at,
            /** When the user was last changed. */
            'updated_at' => $this->updated_at,
        ];
    }
}

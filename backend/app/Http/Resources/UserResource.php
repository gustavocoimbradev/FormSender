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
     * @return array{id: int, name: string, email: string, role: string, is_owner: bool, created_at: Carbon|null, updated_at: Carbon|null}
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
            /** What the user can do: `admin` or `user`. */
            'role' => $this->role->value,
            /** True for the administrator created at setup, the only one who can change or remove other admins. */
            'is_owner' => $this->is_owner,
            /** When the user was created. */
            'created_at' => $this->created_at,
            /** When the user was last changed. */
            'updated_at' => $this->updated_at,
        ];
    }
}

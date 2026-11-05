<?php

declare(strict_types=1);

namespace App\Actions\Setup;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CreateInitialAdminAction
{
    /**
     * Creates the owner account. Only works while no admin exists; the lock
     * stops two simultaneous requests from both creating an owner.
     *
     * @param  array{name?: ?string, email: string, password: string}  $data
     */
    public function execute(array $data): User
    {
        return Cache::lock('setup', 10)->block(5, function () use ($data): User {
            abort_if(User::where('role', Role::Admin)->exists(), 403, 'Setup has already been completed.');

            return DB::transaction(function () use ($data): User {
                $owner = new User([
                    'name' => $data['name'] ?? 'Admin',
                    'email' => $data['email'],
                    'password' => $data['password'],
                ]);
                $owner->role = Role::Admin;
                $owner->is_owner = true;
                $owner->save();

                return $owner;
            });
        });
    }
}

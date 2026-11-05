<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function view(User $actor, User $target): bool
    {
        return $actor->isAdmin();
    }

    public function create(User $actor): bool
    {
        return $actor->isAdmin();
    }

    /**
     * Admins edit regular users and themselves; other admins and the owner
     * can only be edited by the owner (or by themselves).
     */
    public function update(User $actor, User $target): bool
    {
        return $actor->isAdmin()
            && ($actor->is($target) || $target->role === Role::User || $actor->isOwner());
    }

    /**
     * Nobody changes the owner's or their own role; only the owner changes another admin's role.
     */
    public function changeRole(User $actor, User $target): bool
    {
        return $actor->isAdmin()
            && ! $actor->is($target)
            && ! $target->isOwner()
            && ($target->role === Role::User || $actor->isOwner());
    }

    /**
     * Nobody deletes themselves or the owner; only the owner deletes other admins.
     */
    public function delete(User $actor, User $target): bool
    {
        return $actor->isAdmin()
            && ! $actor->is($target)
            && ! $target->isOwner()
            && ($target->role === Role::User || $actor->isOwner());
    }
}

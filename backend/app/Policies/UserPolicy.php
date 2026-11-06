<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

/**
 * There is one administrator (the one who installed it), and only the administrator manages accounts.
 */
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

    public function update(User $actor, User $target): bool
    {
        return $actor->isAdmin();
    }

    /**
     * The administrator removes any account, but never their own.
     */
    public function delete(User $actor, User $target): bool
    {
        return $actor->isAdmin() && ! $actor->is($target);
    }
}

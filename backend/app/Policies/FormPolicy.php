<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Form;
use App\Models\User;

class FormPolicy
{
    /**
     * A person works with their own forms; the administrator works with every form.
     */
    public function view(User $user, Form $form): bool
    {
        return $user->isAdmin() || $form->user_id === $user->id;
    }

    public function update(User $user, Form $form): bool
    {
        return $this->view($user, $form);
    }

    public function delete(User $user, Form $form): bool
    {
        return $this->view($user, $form);
    }
}

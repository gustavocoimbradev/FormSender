<?php

declare(strict_types=1);

namespace App\Actions\Form;

use App\Models\Form;
use App\Models\User;

class CreateContactFormAction
{
    /**
     * The form every new account starts with, so there is something to use at once: a "Contact" form (the email and
     * the name are required, the message is not) that delivers to the account's own address, which needs no confirmation.
     */
    public function execute(User $owner): Form
    {
        return $owner->forms()->create([
            'name' => 'Contact',
            'fields' => [
                ['name' => 'email', 'label' => 'Your email', 'type' => 'email', 'required' => true],
                ['name' => 'name', 'label' => 'Your name', 'type' => 'text', 'required' => true],
                ['name' => 'message', 'label' => 'Message', 'type' => 'textarea', 'required' => false],
            ],
            'destinations' => [$owner->email],
        ]);
    }
}

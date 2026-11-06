<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Form\CreateContactFormAction;
use App\Jobs\SendEmailConfirmation;
use App\Models\EmailConfirmation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RegisterAccountAction
{
    public function __construct(private readonly CreateContactFormAction $createContactForm) {}

    /**
     * Creates a regular account with its first form that cannot log in until its email is confirmed, and queues the email with the link.
     *
     * @param  array{name: string, email: string, password: string}  $data
     */
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $user = User::create($data);
            $this->createContactForm->execute($user);

            SendEmailConfirmation::dispatch(
                $user->email,
                EmailConfirmation::issue($user->email, $user),
                'Confirm your FormSender account',
                'Welcome to FormSender. Confirm your email to start creating forms.',
            );

            return $user;
        });
    }
}

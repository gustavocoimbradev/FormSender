<?php

declare(strict_types=1);

namespace App\Actions\Form;

use App\Jobs\SendEmailConfirmation;
use App\Models\EmailConfirmation;
use App\Models\Form;

class SyncFormDestinationsAction
{
    /**
     * After a form is saved: forgets the confirmation of an address that is no longer a destination and asks every
     * new one to confirm that it wants the messages. The owner's own address and the administrator's forms need nothing.
     *
     * @param  list<string>  $previousDestinations  The destinations the form had before this change (none for a new form).
     */
    public function execute(Form $form, array $previousDestinations = []): void
    {
        if (! $form->requiresConfirmation()) {
            return;
        }

        $kept = fn (string $address, array $list): bool => in_array(strtolower($address), array_map('strtolower', $list), true);

        $form->confirmed_destinations = array_values(array_filter(
            $form->confirmed_destinations,
            fn (string $address): bool => $kept($address, $form->destinations),
        ));
        $form->save();

        EmailConfirmation::where('form_id', $form->id)
            ->get()
            ->reject(fn (EmailConfirmation $confirmation): bool => $kept($confirmation->email, $form->destinations))
            ->each->delete();

        $waiting = $form->pendingDestinations();

        foreach ($waiting as $address) {
            if ($kept($address, $previousDestinations)) {
                continue;
            }

            $this->ask($form, $address);
        }
    }

    /**
     * Emails a new link to an address that has to confirm it wants this form's messages.
     */
    public function ask(Form $form, string $address): void
    {
        SendEmailConfirmation::dispatch(
            $address,
            EmailConfirmation::issue($address, null, $form),
            "Confirm that you want the messages of \"{$form->name}\"",
            "{$form->user?->name} asked to send the messages of the form \"{$form->name}\" to this address. Confirm that you want to receive them.",
        );
    }
}

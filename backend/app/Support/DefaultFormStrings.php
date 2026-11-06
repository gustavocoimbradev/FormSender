<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Every text the embedded form shows by itself (not the labels of the form's fields, which the owner already
 * writes). A form keeps only the ones its owner changed; the rest follow these.
 */
final class DefaultFormStrings
{
    /**
     * @return array<string, string>
     */
    public static function texts(): array
    {
        return [
            'send' => 'Send',
            'sending' => 'Sending',
            'select' => 'Select',
            'sent' => 'Message sent!',
            'required' => 'Fill in this field.',
            'required_file' => 'Choose a file.',
            'required_check' => 'This box must be ticked.',
            'invalid_email' => 'Enter a valid email.',
            'invalid_number' => 'Enter a number.',
            'check_fields' => 'Check the highlighted fields.',
            'too_many' => 'Too many attempts. Please wait a minute and try again.',
            'forbidden' => 'This form cannot be sent from this site.',
            'unavailable' => 'This form cannot receive messages right now.',
            'daily_limit' => 'This form reached its limit of messages for today. Please try again tomorrow.',
            'failed' => 'Could not send. Please try again.',
            'offline' => 'Could not send. Please check your connection and try again.',
        ];
    }

    /**
     * What each text is for, in plain words.
     *
     * @return array<string, string>
     */
    public static function descriptions(): array
    {
        return [
            'send' => 'Send button',
            'sending' => 'Send button while it sends',
            'select' => 'Empty choice of a list',
            'sent' => 'Message sent',
            'required' => 'A required field left empty',
            'required_file' => 'A required file not chosen',
            'required_check' => 'A required box not ticked',
            'invalid_email' => 'An email that is not valid',
            'invalid_number' => 'A number that is not valid',
            'check_fields' => 'The site found mistakes in the fields',
            'too_many' => 'Too many attempts',
            'forbidden' => 'Sent from a site that is not allowed',
            'unavailable' => 'The form cannot receive messages',
            'daily_limit' => 'The form reached its daily limit of messages',
            'failed' => 'Could not send',
            'offline' => 'No connection',
        ];
    }
}

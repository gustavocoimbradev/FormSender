<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

final class SmtpMailer
{
    public const MAILER = 'saved-smtp';

    /**
     * Points the "saved-smtp" mailer at the SMTP settings stored in the database
     * (editable through the API) and returns them.
     *
     * @return array<string, mixed>
     */
    public static function configure(): array
    {
        $smtp = Setting::where('key', 'smtp')->first()?->value;

        if ($smtp === null) {
            throw new RuntimeException('SMTP is not configured.');
        }

        config(['mail.mailers.'.self::MAILER => [
            'transport' => 'smtp',
            'host' => $smtp['host'],
            'port' => (int) $smtp['port'],
            'username' => $smtp['username'] ?? null,
            'password' => $smtp['password'] ?? null,
            'scheme' => ($smtp['encryption'] ?? null) === 'ssl' ? 'smtps' : null,
            'timeout' => 15,
        ]]);

        if (! Mail::isFake()) {
            Mail::purge(self::MAILER);
        }

        return $smtp;
    }
}

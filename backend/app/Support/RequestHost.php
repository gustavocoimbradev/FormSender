<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Request;

final class RequestHost
{
    /**
     * Host of the page that triggered the request: the Origin header, or the
     * Referer when there is no Origin. Lowercase, without scheme or port.
     */
    public static function from(Request $request): ?string
    {
        foreach (['Origin', 'Referer'] as $header) {
            $value = $request->headers->get($header);

            if ($value === null || $value === '') {
                continue;
            }

            $host = parse_url($value, PHP_URL_HOST);

            return is_string($host) && $host !== '' ? strtolower($host) : null;
        }

        return null;
    }
}

<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Models addressed by a random public code instead of the numeric id, so nobody
 * can walk through them by counting.
 */
trait HasPublicCode
{
    public static function bootHasPublicCode(): void
    {
        static::creating(function ($model): void {
            $model->code ??= static::newCode();
        });
    }

    public static function newCode(): string
    {
        do {
            // Always a letter first: the code starts the ids of the embedded form, and a CSS id cannot start with a digit.
            $code = chr(random_int(97, 122)).strtolower(Str::random(19));
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function getRouteKeyName(): string
    {
        return 'code';
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Whether anyone can create an account. Closed until the administrator opens it.
     */
    public static function registrationOpen(): bool
    {
        return (bool) (static::where('key', 'registration')->first()?->value['open'] ?? false);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'encrypted:array',
        ];
    }
}

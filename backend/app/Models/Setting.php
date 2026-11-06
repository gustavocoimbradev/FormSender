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
     * A limit the administrator set for every account (`max_forms`, `max_daily_submissions`), or null when unlimited.
     */
    public static function quota(string $key): ?int
    {
        $value = static::where('key', 'quotas')->first()?->value[$key] ?? null;

        return $value === null || $value === '' ? null : (int) $value;
    }

    /**
     * How many days messages are kept. What the administrator saved in the panel wins; until then it follows the
     * environment (`SUBMISSION_RETENTION_DAYS`). Zero keeps everything.
     */
    public static function retentionDays(): int
    {
        $saved = static::where('key', 'retention')->first()?->value['days'] ?? null;

        return max(0, (int) ($saved ?? config('formsender.submission_retention_days')));
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

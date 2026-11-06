<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $email
 * @property int|null $user_id
 * @property int|null $form_id
 * @property Carbon $expires_at
 */
class EmailConfirmation extends Model
{
    public const TTL_HOURS = 48;

    public const COOLDOWN_SECONDS = 60;

    protected $fillable = ['email', 'user_id', 'form_id', 'token_hash', 'expires_at'];

    protected $hidden = ['token_hash'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    /**
     * Makes a new link for an account or for a form's destination (an older one for the same thing stops working)
     * and returns the token to email. Only its fingerprint is saved.
     */
    public static function issue(string $email, ?User $user = null, ?Form $form = null): string
    {
        static::query()
            ->where('email', $email)
            ->where('user_id', $user?->id)
            ->where('form_id', $form?->id)
            ->delete();

        $token = Str::random(48);

        static::create([
            'email' => $email,
            'user_id' => $user?->id,
            'form_id' => $form?->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addHours(self::TTL_HOURS),
        ]);

        return $token;
    }

    public static function findByToken(string $token): ?self
    {
        return static::where('token_hash', hash('sha256', $token))->where('expires_at', '>', now())->first();
    }

    /**
     * Where the person clicks to confirm: a page of the panel, which hands the token to the API.
     */
    public static function link(string $token): string
    {
        return rtrim((string) config('formsender.panel_url'), '/').'/confirm?token='.$token;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Form, $this>
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}

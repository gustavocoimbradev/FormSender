<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\SubmissionStatus;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\Setting;
use App\Models\User;

/**
 * The limits the administrator sets for every account (the administrator's own included): how many forms an account
 * can have and how many messages its forms receive in a day. A limit that is not set means unlimited.
 */
final class AccountQuotas
{
    public static function maxForms(): ?int
    {
        return Setting::quota('max_forms');
    }

    public static function maxDailySubmissions(): ?int
    {
        return Setting::quota('max_daily_submissions');
    }

    public static function formsReached(User $user): bool
    {
        $limit = self::maxForms();

        return $limit !== null && $user->forms()->count() >= $limit;
    }

    /**
     * Whether the account that owns the form already received as many messages today as it may. What was caught
     * as spam does not count.
     */
    public static function dailyReached(Form $form): bool
    {
        $limit = self::maxDailySubmissions();

        return $limit !== null && self::receivedToday($form->user_id, $form->id) >= $limit;
    }

    /**
     * What an account has used against each limit (`limit` is null when unlimited).
     *
     * @return array{forms: array{used: int, limit: int|null}, daily_submissions: array{used: int, limit: int|null}}
     */
    public static function usage(User $user): array
    {
        return [
            'forms' => ['used' => $user->forms()->count(), 'limit' => self::maxForms()],
            'daily_submissions' => ['used' => self::receivedToday($user->id), 'limit' => self::maxDailySubmissions()],
        ];
    }

    /**
     * Messages received since the day began, by an account (or, for a form with no owner, by that form).
     */
    private static function receivedToday(?int $userId, ?int $formId = null): int
    {
        return FormSubmission::query()
            ->where('status', '!=', SubmissionStatus::Spam->value)
            ->where('created_at', '>=', now()->startOfDay())
            ->when($userId !== null, fn ($query) => $query->where('user_id', $userId), fn ($query) => $query->where('form_id', $formId))
            ->count();
    }
}

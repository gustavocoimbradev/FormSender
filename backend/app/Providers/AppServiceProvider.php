<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('manage-settings', fn (User $user): bool => $user->isAdmin());

        RateLimiter::for('api', fn (Request $request): Limit => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('form-submit', function (Request $request): Limit {
            $form = $request->route('form');

            return Limit::perMinute(20)->by((is_object($form) ? $form->getKey() : $form).'|'.$request->ip());
        });

        RateLimiter::for('setup', fn (Request $request): Limit => Limit::perMinute(5)->by($request->ip()));
    }
}

<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
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
        // The API documentation is served at the root of the backend; outside
        // local/testing environments it stays closed.
        Scramble::configure()
            ->expose(ui: '/', document: '/openapi.json')
            ->afterOpenApiGenerated(function (OpenApi $openApi): void {
                $openApi->info->title = 'FormSender API';
            });

        Gate::define('viewApiDocs', fn (?User $user = null): bool => app()->environment(['local', 'testing']));

        Gate::define('manage-settings', fn (User $user): bool => $user->isAdmin());

        RateLimiter::for('api', fn (Request $request): Limit => Limit::perMinute((int) config('app.api_rate_limit'))
            ->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('form-submit', function (Request $request): Limit {
            $form = $request->route('form');

            return Limit::perMinute(20)->by((is_object($form) ? $form->getKey() : $form).'|'.$request->ip());
        });

        // Drawing a form is cheap and happens on every page view, so it is limited far above a real person.
        RateLimiter::for('form-public', function (Request $request): Limit {
            $form = $request->route('form');

            return Limit::perMinute(120)->by((is_object($form) ? $form->getKey() : $form).'|'.$request->ip());
        });

        RateLimiter::for('password-reset', fn (Request $request): Limit => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('setup', fn (Request $request): Limit => Limit::perMinute(5)->by($request->ip()));
    }
}

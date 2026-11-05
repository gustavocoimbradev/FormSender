<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Form;
use App\Support\RequestHost;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAllowedDomain
{
    /**
     * When the form lists allowed domains, the page that sends it (Origin, or
     * Referer when there is no Origin) must be one of them. An empty list lets any site through.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $form = $request->route('form');

        if ($form instanceof Form) {
            abort_unless($form->allowsHost(RequestHost::from($request)), 403, 'This domain is not allowed to submit this form.');
        }

        return $next($request);
    }
}

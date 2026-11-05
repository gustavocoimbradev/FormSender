<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Form;
use App\Support\RequestHost;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeFormSubmission
{
    /**
     * A submission needs the form's own bearer token and, when the form
     * restricts domains, a matching Origin/Referer.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $form = $request->route('form');

        if ($form instanceof Form) {
            $provided = (string) $request->bearerToken();

            abort_if(
                $provided === '' || ! hash_equals((string) $form->token, $provided),
                401,
                'Invalid or missing form token.',
                ['WWW-Authenticate' => 'Bearer'],
            );

            abort_unless($form->allowsHost(RequestHost::from($request)), 403, 'This domain is not allowed to submit this form.');
        }

        return $next($request);
    }
}

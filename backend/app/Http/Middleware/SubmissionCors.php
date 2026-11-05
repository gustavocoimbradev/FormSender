<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Form;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SubmissionCors
{
    private const PATTERN = '#^api/forms/(\d+)/submit$#';

    /**
     * The submit endpoint is called from other people's websites, so CORS is
     * decided per form: the origin must be in the form's allowed domains
     * (or the list must be empty). Every other route keeps the global CORS config.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');

        if ($origin === null || ! preg_match(self::PATTERN, $request->path(), $matches)) {
            return $next($request);
        }

        $form = Form::find((int) $matches[1]);
        $host = parse_url($origin, PHP_URL_HOST);
        $allowed = $form !== null && $form->allowsHost(is_string($host) ? strtolower($host) : null);

        if ($request->isMethod('OPTIONS')) {
            return $allowed
                ? response()->noContent(204, $this->headers($origin) + [
                    'Access-Control-Allow-Methods' => 'POST, OPTIONS',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization, Accept',
                    'Access-Control-Max-Age' => '600',
                ])
                : response('', 403);
        }

        $response = $next($request);

        if ($allowed) {
            foreach ($this->headers($origin) as $name => $value) {
                $response->headers->set($name, $value);
            }
        } else {
            $response->headers->remove('Access-Control-Allow-Origin');
        }

        return $response;
    }

    /**
     * @return array<string, string>
     */
    private function headers(string $origin): array
    {
        return [
            'Access-Control-Allow-Origin' => $origin,
            'Vary' => 'Origin',
        ];
    }
}

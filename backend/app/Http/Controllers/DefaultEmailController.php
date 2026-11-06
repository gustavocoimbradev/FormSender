<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\DefaultEmailTemplate;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Email', description: 'The email delivered for a form is written in the form itself: a subject and an HTML body made for email clients, with variables that are filled in with each message. These endpoints help while writing it.', weight: 5)]
class DefaultEmailController extends Controller
{
    /**
     * Get the default email.
     *
     * The subject and HTML every form starts with, until its own email is written. Useful to go back to it.
     *
     * @response array{data: array{subject: string, html: string}}
     */
    #[Endpoint(operationId: 'getDefaultEmail')]
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => ['subject' => DefaultEmailTemplate::SUBJECT, 'html' => DefaultEmailTemplate::HTML]]);
    }
}

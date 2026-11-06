<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\DefaultFormStrings;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Forms', description: 'A form defines which fields it accepts, where its messages are delivered (destinations), which websites may send it and its own public code.', weight: 4)]
class DefaultStringsController extends Controller
{
    /**
     * Get the default texts.
     *
     * Every text the embedded form shows by itself (the send button, the notices, the messages about a field), with what it is
     * for and its default words. A form changes any of them with its `strings`.
     *
     * @response array{data: list<array{key: string, description: string, text: string}>}
     */
    #[Endpoint(operationId: 'getDefaultStrings')]
    public function __invoke(): JsonResponse
    {
        $descriptions = DefaultFormStrings::descriptions();

        return response()->json(['data' => array_map(
            fn (string $key, string $text): array => ['key' => $key, 'description' => $descriptions[$key], 'text' => $text],
            array_keys(DefaultFormStrings::texts()),
            DefaultFormStrings::texts(),
        )]);
    }
}

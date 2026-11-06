<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\AccountQuotas;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Settings', description: 'Email (SMTP) settings used to deliver the messages, whether new accounts are allowed, how long messages are kept and the limits of each account. Admin only.', weight: 8)]
class QuotaController extends Controller
{
    /**
     * Get what the account has used.
     *
     * For the account that is logged in, administrator included: how many forms it has and how many messages its
     * forms received today, each against the limit the administrator set (`limit` is empty when there is none).
     *
     * @response array{data: array{forms: array{used: int, limit: int|null}, daily_submissions: array{used: int, limit: int|null}}}
     */
    #[Endpoint(operationId: 'getQuotas')]
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json(['data' => AccountQuotas::usage($request->user())]);
    }
}

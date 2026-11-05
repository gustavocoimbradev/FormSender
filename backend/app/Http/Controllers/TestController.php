<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Test\GetTestStatusAction;
use Illuminate\Http\JsonResponse;

final class TestController extends Controller
{
    public function __invoke(GetTestStatusAction $getTestStatus): JsonResponse
    {
        return response()->json($getTestStatus->execute());
    }
}

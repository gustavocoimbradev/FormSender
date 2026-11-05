<?php

namespace App\Http\Controllers;

use App\Actions\Setup\CreateInitialAdminAction;
use App\Http\Requests\SetupRequest;
use App\Http\Resources\UserResource;

class SetupController extends Controller
{
    public function __invoke(SetupRequest $request, CreateInitialAdminAction $createInitialAdmin): UserResource
    {
        return new UserResource($createInitialAdmin->execute($request->validated()));
    }
}

<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('setup', SetupController::class)->middleware('throttle:setup');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('forms', FormController::class);

    Route::apiResource('users', UserController::class);

    Route::middleware('can:manage-settings')->group(function () {
        Route::get('settings', [SettingController::class, 'show']);
        Route::put('settings', [SettingController::class, 'update']);
    });
});

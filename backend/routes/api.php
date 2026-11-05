<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\FormSubmissionController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\SubmitFormController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\AuthorizeFormSubmission;
use Illuminate\Support\Facades\Route;

Route::post('setup', SetupController::class)->middleware('throttle:setup');
Route::post('forms/{form}/submit', SubmitFormController::class)
    ->middleware(['throttle:form-submit', AuthorizeFormSubmission::class]);

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('auth/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:password-reset');
Route::post('auth/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('forms', FormController::class);
    Route::post('forms/{form}/token', [FormController::class, 'regenerateToken']);
    Route::apiResource('forms.submissions', FormSubmissionController::class)->only(['index', 'show'])->scoped();

    Route::apiResource('users', UserController::class);

    Route::middleware('can:manage-settings')->group(function () {
        Route::get('settings', [SettingController::class, 'show']);
        Route::put('settings', [SettingController::class, 'update']);
    });
});

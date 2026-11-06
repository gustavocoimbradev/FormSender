<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\FormSubmissionController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\RetrySubmissionController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\SubmissionAttachmentController;
use App\Http\Controllers\SubmitFormController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\TemplatePreviewController;
use App\Http\Controllers\TestFormController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureAllowedDomain;
use Illuminate\Support\Facades\Route;

Route::get('setup', [SetupController::class, 'status']);
Route::post('setup', SetupController::class)->middleware('throttle:setup');
Route::post('forms/{form:code}/submit', SubmitFormController::class)
    ->middleware(['throttle:form-submit', EnsureAllowedDomain::class]);

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('auth/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:password-reset');
Route::post('auth/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('forms', FormController::class);
    Route::post('forms/{form}/test', TestFormController::class);
    Route::apiResource('forms.submissions', FormSubmissionController::class)->only(['index', 'show'])->scoped();
    Route::post('forms/{form}/submissions/{submission}/retry', RetrySubmissionController::class)->scopeBindings();
    Route::get('forms/{form}/submissions/{submission}/attachments/{attachment}', SubmissionAttachmentController::class)->scopeBindings();

    Route::post('templates/preview', TemplatePreviewController::class);
    Route::apiResource('templates', TemplateController::class)->parameters(['templates' => 'template:code']);

    Route::apiResource('users', UserController::class);

    Route::middleware('can:manage-settings')->group(function () {
        Route::get('settings', [SettingController::class, 'show']);
        Route::put('settings', [SettingController::class, 'update']);
    });
});

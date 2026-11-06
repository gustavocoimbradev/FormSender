<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DefaultEmailController;
use App\Http\Controllers\DefaultStringsController;
use App\Http\Controllers\DefaultStyleController;
use App\Http\Controllers\DestinationConfirmationController;
use App\Http\Controllers\EmailConfirmationController;
use App\Http\Controllers\EmailPreviewController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\FormSubmissionController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PublicFormController;
use App\Http\Controllers\QuotaController;
use App\Http\Controllers\RetrySubmissionController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\SubmissionAttachmentController;
use App\Http\Controllers\SubmitFormController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureAllowedDomain;
use Illuminate\Support\Facades\Route;

Route::get('setup', [SetupController::class, 'status']);
Route::post('setup', SetupController::class)->middleware('throttle:setup');
Route::get('forms/{form:code}/public', PublicFormController::class)
    ->middleware(['throttle:form-public', EnsureAllowedDomain::class]);
Route::post('forms/{form:code}/submit', SubmitFormController::class)
    ->middleware(['throttle:form-submit', EnsureAllowedDomain::class]);

Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('auth/resend-confirmation', [AuthController::class, 'resendConfirmation'])->middleware('throttle:password-reset');
Route::post('email-confirmations', EmailConfirmationController::class)->middleware('throttle:email-confirmation');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('auth/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:password-reset');
Route::post('auth/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('quotas', QuotaController::class);

    Route::apiResource('forms', FormController::class);
    Route::apiResource('forms.submissions', FormSubmissionController::class)->only(['index', 'show'])->scoped();
    Route::post('forms/{form}/submissions/{submission}/retry', RetrySubmissionController::class)->scopeBindings();
    Route::get('forms/{form}/submissions/{submission}/attachments/{attachment}', SubmissionAttachmentController::class)->scopeBindings();

    Route::post('forms/{form}/destinations/confirmation', DestinationConfirmationController::class);

    Route::get('email/default', DefaultEmailController::class);
    Route::get('forms/{form}/style/default', DefaultStyleController::class);
    Route::get('strings/default', DefaultStringsController::class);
    Route::post('email/preview', EmailPreviewController::class);

    Route::apiResource('users', UserController::class);

    Route::middleware('can:manage-settings')->group(function () {
        Route::get('settings', [SettingController::class, 'show']);
        Route::put('settings', [SettingController::class, 'update']);
    });
});

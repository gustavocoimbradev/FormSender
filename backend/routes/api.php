<?php

use App\Http\Controllers\FormController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::apiResource('forms', FormController::class);

Route::get('settings', [SettingController::class, 'show']);
Route::put('settings', [SettingController::class, 'update']);

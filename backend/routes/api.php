<?php

use App\Http\Controllers\FormController;
use Illuminate\Support\Facades\Route;

Route::apiResource('forms', FormController::class);

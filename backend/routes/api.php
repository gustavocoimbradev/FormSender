<?php

use Illuminate\Support\Facades\Route;

use  App\Http\Controllers\FormController;

Route::apiResource('/forms', FormController::class);
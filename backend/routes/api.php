<?php

declare(strict_types=1);

use App\Http\Controllers\TestController;
use Illuminate\Support\Facades\Route;

Route::get('/test', TestController::class);

<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - PayPen Fintech System
|--------------------------------------------------------------------------
*/

// Public Authentication Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Signed Email Verification Link (named route for Laravel notifications)
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->name('verification.verify');

    // Resend Email Verification
    Route::post('/email/resend', [AuthController::class, 'resendVerification']);
});

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Verified Email Protected Wallet & Profile Endpoints
    Route::middleware('verified.api')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::post('/profile/mpin', [ProfileController::class, 'updateMpin']);
    });
});

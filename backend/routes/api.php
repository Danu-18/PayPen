<?php

use App\Http\Controllers\Api\AdminReconciliationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransferController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - PayPen Fintech System (Sprint 1 & Sprint 2)
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

    // Password Reset (SCRUM-16)
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Verified Email Protected Wallet & Profile Endpoints
    Route::middleware('verified.api')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::post('/profile/mpin', [ProfileController::class, 'updateMpin']);

        // Financial Operations (Protected by Idempotency & Concurrency Locks)
        Route::middleware('idempotent')->group(function () {
            // Simulated Card Deposit (SCRUM-18)
            Route::post('/deposits', [DepositController::class, 'store']);

            // P2P Transfer with 1.5% fee routing & MPIN check (SCRUM-11, 19, 20, 21)
            Route::post('/transfers', [TransferController::class, 'store']);
        });

        // Transaction History & CSV Export (SCRUM-12, 22, 23, 24)
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::get('/transactions/export', [TransactionController::class, 'export']);

        // Admin-only Liquidity Audit & Reconciliation (SCRUM-13)
        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('/reconciliation', [AdminReconciliationController::class, 'index']);
        });
    });
});

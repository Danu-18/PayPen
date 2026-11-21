<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\WalletResource;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle user registration.
     * UserObserver automatically provisions a 0-balance wallet for role === 'user'.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'is_active' => true,
        ]);

        // Trigger Registered event so signed verification email is sent
        event(new Registered($user));

        AuditLogService::record(
            action: 'user_registered',
            actorUserId: $user->id,
            targetType: User::class,
            targetId: $user->id,
            newValues: [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        );

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('wallet');

        return response()->json([
            'message' => 'Registration successful. Please verify your email address.',
            'token' => $token,
            'user' => new UserResource($user),
            'wallet' => new WalletResource($user->wallet),
        ], 201);
    }

    /**
     * Handle user login.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::with('wallet')->where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact support.',
                'code' => 'ACCOUNT_DEACTIVATED',
            ], 403);
        }

        AuditLogService::record(
            action: 'user_logged_in',
            actorUserId: $user->id,
            targetType: User::class,
            targetId: $user->id
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => new UserResource($user),
            'wallet' => $user->wallet ? new WalletResource($user->wallet) : null,
        ]);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            AuditLogService::record(
                action: 'user_logged_out',
                actorUserId: $user->id,
                targetType: User::class,
                targetId: $user->id
            );

            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Verify email via signed URL.
     */
    public function verifyEmail(Request $request, int|string $id, string $hash): JsonResponse|RedirectResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json([
                'message' => 'Invalid email verification link.',
                'code' => 'INVALID_VERIFICATION_LINK',
            ], 400);
        }

        if (! $request->hasValidSignature()) {
            return response()->json([
                'message' => 'Verification link has expired or is invalid.',
                'code' => 'EXPIRED_VERIFICATION_LINK',
            ], 400);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));

            AuditLogService::record(
                action: 'email_verified',
                actorUserId: $user->id,
                targetType: User::class,
                targetId: $user->id
            );
        }

        $freshUser = $user->fresh('wallet');
        $token = $freshUser->createToken('auth_token')->plainTextToken;

        // If browser/client requested json, return json response
        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Email verified successfully.',
                'token' => $token,
                'user' => new UserResource($freshUser),
                'wallet' => $freshUser->wallet ? new WalletResource($freshUser->wallet) : null,
            ]);
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        return redirect()->to("{$frontendUrl}/verify-email/confirm?status=success&token={$token}");
    }

    /**
     * Resend verification email link.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user && $request->filled('email')) {
            $user = User::where('email', $request->input('email'))->first();
        }

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email is already verified.',
                'code' => 'ALREADY_VERIFIED',
            ], 400);
        }

        $user->sendEmailVerificationNotification();

        AuditLogService::record(
            action: 'verification_email_resent',
            actorUserId: $user->id,
            targetType: User::class,
            targetId: $user->id
        );

        return response()->json([
            'message' => 'Verification link sent to your registered email address.',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateMpinRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Get authenticated user profile and wallet.
     * Protected by auth:sanctum and verified.api.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('wallet');

        return response()->json([
            'user' => new UserResource($user),
            'wallet' => $user->wallet ? new \App\Http\Resources\WalletResource($user->wallet) : null,
        ]);
    }

    /**
     * Set or update 4-digit numeric MPIN.
     */
    public function updateMpin(UpdateMpinRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        // If user already has an MPIN, verify current password
        if ($user->has_mpin) {
            if (empty($validated['current_password']) || ! Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The provided current password is incorrect.'],
                ]);
            }
        }

        $user->update([
            'mpin_hash' => Hash::make($validated['mpin']),
            'mpin_attempts' => 0,
            'mpin_locked_until' => null,
        ]);

        AuditLogService::record(
            action: 'mpin_updated',
            actorUserId: $user->id,
            targetType: User::class,
            targetId: $user->id
        );

        return response()->json([
            'message' => $user->wasChanged('mpin_hash') ? 'MPIN saved successfully.' : 'MPIN updated successfully.',
            'user' => new UserResource($user->fresh('wallet')),
        ]);
    }
}

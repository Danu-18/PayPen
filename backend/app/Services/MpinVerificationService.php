<?php

namespace App\Services;

use App\Exceptions\InvalidMpinException;
use App\Exceptions\MpinLockedException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MpinVerificationService
{
    /**
     * Verify the user's 4-digit MPIN with consecutive attempt tracking and lockout safeguards.
     *
     * @param User $user
     * @param string $mpin
     * @return bool
     *
     * @throws ValidationException
     * @throws MpinLockedException
     * @throws InvalidMpinException
     */
    public function verify(User $user, string $mpin): bool
    {
        // 1. Check if user has initialized an MPIN
        if (! $user->has_mpin || empty($user->mpin_hash)) {
            throw ValidationException::withMessages([
                'mpin' => ['You must set up a 4-digit security MPIN before performing this transaction.'],
            ]);
        }

        // 2. Check if currently locked out
        if ($user->mpin_locked_until && $user->mpin_locked_until->isFuture()) {
            $minutesRemaining = ceil(now()->diffInSeconds($user->mpin_locked_until) / 60);
            throw new MpinLockedException(
                "Your MPIN is temporarily locked due to multiple failed attempts. Please try again in {$minutesRemaining} minute(s)."
            );
        }

        // 3. Verify MPIN hash
        if (Hash::check($mpin, $user->mpin_hash)) {
            // Reset attempts on successful verification
            if ($user->mpin_attempts > 0 || $user->mpin_locked_until !== null) {
                $user->update([
                    'mpin_attempts' => 0,
                    'mpin_locked_until' => null,
                ]);
            }
            return true;
        }

        // 4. Handle incorrect MPIN attempt
        $newAttempts = $user->mpin_attempts + 1;

        if ($newAttempts >= 5) {
            $lockUntil = now()->addMinutes(15);
            $user->update([
                'mpin_attempts' => 5,
                'mpin_locked_until' => $lockUntil,
            ]);

            AuditLogService::record(
                action: 'mpin_locked',
                actorUserId: $user->id,
                targetType: User::class,
                targetId: $user->id,
                newValues: ['locked_until' => $lockUntil->toIso8601String(), 'attempts' => 5]
            );

            throw new MpinLockedException(
                'Incorrect MPIN. Maximum attempts reached. Your MPIN has been locked for 15 minutes.'
            );
        }

        $user->update([
            'mpin_attempts' => $newAttempts,
        ]);

        $remaining = 5 - $newAttempts;
        throw new InvalidMpinException(
            "Incorrect MPIN. {$remaining} attempt(s) remaining before account lockout."
        );
    }
}

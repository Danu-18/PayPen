<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Wallet;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        if ($user->role === 'user' && ! Wallet::where('user_id', $user->id)->exists()) {
            do {
                $code = 'PP-' . strtoupper(bin2hex(random_bytes(4)));
            } while (Wallet::where('wallet_code', $code)->exists());

            Wallet::create([
                'user_id' => $user->id,
                'wallet_code' => $code,
                'name' => $user->name . "'s Wallet",
                'type' => 'user',
                'status' => 'active',
                'balance' => 0,
                'currency' => 'PKR',
            ]);
        }
    }
}

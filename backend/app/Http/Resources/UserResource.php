<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'is_email_verified' => $this->hasVerifiedEmail(),
            'has_mpin' => $this->has_mpin,
            'mpin_attempts' => $this->mpin_attempts,
            'mpin_locked_until' => $this->mpin_locked_until?->toISOString(),
            'is_active' => $this->is_active,
            'wallet' => $this->relationLoaded('wallet') || $this->wallet
                ? new WalletResource($this->wallet)
                : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}

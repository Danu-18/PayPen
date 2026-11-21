<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $userWalletId = $user?->wallet?->id;

        $direction = 'deposit';
        $counterparty = 'Deposit Gateway';

        if ($this->type === 'p2p_transfer') {
            if ($this->initiated_by_user_id === $user?->id) {
                $direction = 'sent';
                $counterparty = $this->metadata['recipient_name'] ?? $this->metadata['recipient_email'] ?? 'Recipient';
            } else {
                $direction = 'received';
                $counterparty = $this->initiatedByUser?->name ?? $this->metadata['sender_name'] ?? 'Sender';
            }
        } elseif ($this->type === 'deposit') {
            $direction = 'deposit';
            $counterparty = 'Bank Card Deposit';
        } elseif ($this->type === 'bill_payment') {
            $direction = 'sent';
            $counterparty = $this->metadata['biller_name'] ?? 'Utility Biller';
        }

        // Ledger entry for this user's wallet
        $userLedgerEntry = $this->relationLoaded('ledgerEntries')
            ? $this->ledgerEntries->firstWhere('wallet_id', $userWalletId)
            : ($userWalletId ? $this->ledgerEntries()->where('wallet_id', $userWalletId)->first() : null);

        return [
            'id' => $this->id,
            'reference_id' => $this->reference_id,
            'type' => $this->type,
            'direction' => $direction,
            'counterparty' => $counterparty,
            'amount' => $this->amount,
            'formatted_amount' => $this->formatted_amount,
            'fee' => $this->fee,
            'formatted_fee' => $this->formatted_fee,
            'status' => $this->status,
            'description' => $this->description,
            'metadata' => $this->metadata,
            'flagged_for_review' => (bool) $this->flagged_for_review,
            'balance_after' => $userLedgerEntry?->balance_after,
            'formatted_balance_after' => $userLedgerEntry ? number_format($userLedgerEntry->balance_after / 100, 2) : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

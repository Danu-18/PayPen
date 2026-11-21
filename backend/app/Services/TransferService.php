<?php

namespace App\Services;

use App\Exceptions\InsufficientFundsException;
use App\Exceptions\WalletFrozenException;
use App\Models\SystemSetting;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class TransferService
{
    public function __construct(
        protected LedgerService $ledgerService,
        protected MpinVerificationService $mpinService
    ) {}

    /**
     * Execute peer-to-peer transfer with integer 1.5% fee routing and MPIN authorization.
     * Recipient can be specified via Email address or unique Wallet ID (e.g. PP-XXXXXXXX or XXXXXXXX).
     *
     * @param User $sender
     * @param string $recipientIdentifier
     * @param int $amountMinor
     * @param string $mpin
     * @param string|null $note
     * @param string|null $recipientEmail Optional alias for recipientIdentifier
     * @return Transaction
     *
     * @throws ValidationException
     * @throws WalletFrozenException
     * @throws InsufficientFundsException
     */
    public function transfer(
        User $sender,
        string $recipientIdentifier = '',
        int $amountMinor = 0,
        string $mpin = '',
        ?string $note = null,
        ?string $recipientEmail = null
    ): Transaction {
        // 1. Amount validation
        if ($amountMinor <= 0) {
            throw ValidationException::withMessages([
                'amount' => ['Transfer amount must be greater than zero.'],
            ]);
        }

        // 2. Sender wallet verification (always query database for latest state)
        $senderWallet = $sender->wallet()->first();
        if (! $senderWallet) {
            throw new InvalidArgumentException('Sender does not have an active digital wallet.');
        }

        if ($senderWallet->status === 'frozen') {
            throw new WalletFrozenException('Your digital wallet is frozen. Transfers are disabled.');
        }

        // 3. Verify MPIN authorization
        $this->mpinService->verify($sender, $mpin);

        // 4. Recipient lookup & validation (supports Email OR Wallet ID)
        $rawIdentifier = trim($recipientEmail ?: $recipientIdentifier);
        if ($rawIdentifier === '') {
            throw ValidationException::withMessages([
                'recipient' => ['Recipient email address or Wallet ID is required.'],
                'recipient_email' => ['Recipient email address or Wallet ID is required.'],
            ]);
        }

        $recipient = null;
        $recipientWallet = null;

        if (str_contains($rawIdentifier, '@')) {
            // Recipient lookup by Email
            $recipient = User::where('email', strtolower($rawIdentifier))->first();
            if ($recipient) {
                $recipientWallet = $recipient->wallet()->first();
            }
        } else {
            // Recipient lookup by Wallet ID (accepts with or without 'PP-' prefix, case-insensitive)
            $normalizedCode = strtoupper($rawIdentifier);
            if (! str_starts_with($normalizedCode, 'PP-')) {
                $normalizedCode = 'PP-' . $normalizedCode;
            }

            $recipientWallet = Wallet::where('wallet_code', $normalizedCode)->first();
            if ($recipientWallet && $recipientWallet->user_id) {
                $recipient = $recipientWallet->user;
            }
        }

        if (! $recipient || ! $recipientWallet) {
            throw ValidationException::withMessages([
                'recipient' => ['No registered PayPen user found with that email address or Wallet ID.'],
                'recipient_email' => ['No registered PayPen user found with that email address or Wallet ID.'],
            ]);
        }

        if ($recipient->id === $sender->id || $recipientWallet->id === $senderWallet->id) {
            throw ValidationException::withMessages([
                'recipient' => ['You cannot transfer funds to your own wallet.'],
                'recipient_email' => ['You cannot transfer funds to your own wallet.'],
            ]);
        }

        if ($recipientWallet->status === 'frozen') {
            throw ValidationException::withMessages([
                'recipient' => ['Recipient wallet is not active or is temporarily frozen.'],
                'recipient_email' => ['Recipient wallet is not active or is temporarily frozen.'],
            ]);
        }

        // 5. System limits check
        $maxSingleLimit = (int) SystemSetting::getValue('max_single_transfer_minor', 5000000);
        if ($amountMinor > $maxSingleLimit) {
            $formattedLimit = number_format($maxSingleLimit / 100, 2);
            throw ValidationException::withMessages([
                'amount' => ["Transfer amount exceeds the maximum single transfer limit of PKR {$formattedLimit}."],
            ]);
        }

        $dailyLimit = (int) SystemSetting::getValue('daily_transfer_limit_minor', 10000000);
        $todaySentTotal = (int) Transaction::where('initiated_by_user_id', $sender->id)
            ->where('type', 'p2p_transfer')
            ->where('status', 'completed')
            ->whereDate('created_at', today())
            ->sum('amount');

        if (($todaySentTotal + $amountMinor) > $dailyLimit) {
            $formattedDaily = number_format($dailyLimit / 100, 2);
            $formattedRemaining = number_format(max(0, $dailyLimit - $todaySentTotal) / 100, 2);
            throw ValidationException::withMessages([
                'amount' => ["Daily transfer limit of PKR {$formattedDaily} exceeded. Remaining allowance today: PKR {$formattedRemaining}."],
            ]);
        }

        // 6. Platform fee calculation (1.5% fee on top, half-up integer rounding in Paisa)
        $feePercentage = (float) SystemSetting::getValue('fee_percentage', '1.5');
        $feeBps = (int) round($feePercentage * 100); // 150 basis points for 1.5%
        $feeMinor = intdiv($amountMinor * $feeBps + 5000, 10000);
        $totalDebit = $amountMinor + $feeMinor;

        // Upfront balance check
        if ($senderWallet->balance < $totalDebit) {
            $formattedNeeded = number_format($totalDebit / 100, 2);
            $formattedAvailable = number_format($senderWallet->balance / 100, 2);
            throw new InsufficientFundsException(
                "Insufficient funds. Total required: PKR {$formattedNeeded} (Amount: PKR " .
                number_format($amountMinor / 100, 2) . " + Fee: PKR " . number_format($feeMinor / 100, 2) .
                "). Available balance: PKR {$formattedAvailable}."
            );
        }

        // 7. Fraud detection rules
        $fraudThreshold = (int) SystemSetting::getValue('fraud_flag_threshold_minor', 2500000); // 25,000 PKR
        $recentTransfersCount = Transaction::where('initiated_by_user_id', $sender->id)
            ->where('type', 'p2p_transfer')
            ->where('created_at', '>=', now()->subMinutes(2))
            ->count();

        $flagged = false;
        $flagReason = null;

        if ($amountMinor >= $fraudThreshold) {
            $flagged = true;
            $flagReason = 'High-value transaction exceeding automated fraud threshold.';
        } elseif ($recentTransfersCount >= 3) {
            $flagged = true;
            $flagReason = 'High frequency velocity: sender initiated > 3 transfers within 2 minutes.';
        }

        // 8. Retrieve system revenue wallet
        $revenueWallet = Wallet::where('wallet_code', 'PP-SYS-REVENUE')->firstOrFail();

        // 9. Create pending transaction
        $tx = Transaction::create([
            'reference_id' => Str::uuid()->toString(),
            'initiated_by_user_id' => $sender->id,
            'type' => 'p2p_transfer',
            'amount' => $amountMinor,
            'fee' => $feeMinor,
            'status' => 'pending',
            'description' => "P2P Transfer to {$recipient->name}",
            'metadata' => [
                'sender_name' => $sender->name,
                'sender_email' => $sender->email,
                'sender_wallet_code' => $senderWallet->wallet_code,
                'recipient_id' => $recipient->id,
                'recipient_name' => $recipient->name,
                'recipient_email' => $recipient->email,
                'recipient_wallet_code' => $recipientWallet->wallet_code,
                'recipient_identifier' => $rawIdentifier,
                'note' => $note ? trim($note) : null,
                'fee_percentage' => $feePercentage,
            ],
            'flagged_for_review' => $flagged,
            'flag_reason' => $flagReason,
        ]);

        // 10. Execute all entries atomically in ONE DB transaction via LedgerService
        // Sender debited amount + fee, Recipient credited amount, Revenue credited fee
        $entries = [
            [
                'wallet_id' => $senderWallet->id,
                'entry_type' => 'DEBIT',
                'amount' => $totalDebit,
            ],
            [
                'wallet_id' => $recipientWallet->id,
                'entry_type' => 'CREDIT',
                'amount' => $amountMinor,
            ],
        ];

        if ($feeMinor > 0) {
            $entries[] = [
                'wallet_id' => $revenueWallet->id,
                'entry_type' => 'CREDIT',
                'amount' => $feeMinor,
            ];
        }

        $this->ledgerService->postEntries($tx, $entries);

        // 11. Mark completed
        $tx->update(['status' => 'completed']);

        // 12. Audit log
        AuditLogService::record(
            action: 'p2p_transfer_completed',
            actorUserId: $sender->id,
            targetType: Transaction::class,
            targetId: $tx->id,
            newValues: [
                'amount' => $amountMinor,
                'fee' => $feeMinor,
                'total_debit' => $totalDebit,
                'recipient_id' => $recipient->id,
                'flagged_for_review' => $flagged,
            ]
        );

        return $tx;
    }
}

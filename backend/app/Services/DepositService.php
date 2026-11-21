<?php

namespace App\Services;

use App\Exceptions\PaymentDeclinedException;
use App\Exceptions\WalletFrozenException;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use App\Services\Gateways\PaymentGatewayInterface;
use Illuminate\Support\Str;
use InvalidArgumentException;

class DepositService
{
    public function __construct(
        protected PaymentGatewayInterface $gateway,
        protected LedgerService $ledgerService
    ) {}

    /**
     * Execute a bank card deposit into user's wallet.
     *
     * @param User $user
     * @param int $amountMinor
     * @param array{card_number: string, exp_month?: string, exp_year?: string, cvc?: string} $cardDetails
     * @return Transaction
     *
     * @throws WalletFrozenException
     * @throws PaymentDeclinedException
     */
    public function deposit(User $user, int $amountMinor, array $cardDetails): Transaction
    {
        if ($amountMinor <= 0) {
            throw new InvalidArgumentException('Deposit amount must be greater than zero.');
        }

        $wallet = $user->wallet()->first();
        if (! $wallet) {
            throw new InvalidArgumentException('User does not have an active digital wallet.');
        }

        if ($wallet->status === 'frozen') {
            throw new WalletFrozenException('Your digital wallet is currently frozen. Deposits cannot be accepted.');
        }

        $rawCardNumber = preg_replace('/\D/', '', (string) ($cardDetails['card_number'] ?? ''));
        $last4 = substr($rawCardNumber, -4) ?: '0000';

        // 1. Create pending transaction
        $tx = Transaction::create([
            'reference_id' => Str::uuid()->toString(),
            'initiated_by_user_id' => $user->id,
            'type' => 'deposit',
            'amount' => $amountMinor,
            'fee' => 0,
            'status' => 'pending',
            'description' => "Deposit via Card **** {$last4}",
            'metadata' => [
                'card_last4' => $last4,
                'gateway' => 'SandboxGateway',
            ],
            'flagged_for_review' => false,
        ]);

        // 2. Charge card via gateway
        $response = $this->gateway->charge($amountMinor, $cardDetails);

        if (! $response->successful) {
            $tx->update([
                'status' => 'failed',
                'metadata' => array_merge($tx->metadata ?? [], [
                    'error_code' => $response->errorCode,
                    'error_message' => $response->errorMessage,
                ]),
            ]);

            throw new PaymentDeclinedException(
                message: $response->errorMessage ?? 'Payment card was declined.',
                errorCode: $response->errorCode ?? 'CARD_DECLINED',
                statusCode: 422
            );
        }

        // 3. Post double-entry ledger entries:
        // DEBIT system_clearing, CREDIT user_wallet
        $clearingWallet = Wallet::where('wallet_code', 'PP-SYS-CLEARING')->firstOrFail();

        $this->ledgerService->postEntries($tx, [
            [
                'wallet_id' => $clearingWallet->id,
                'entry_type' => 'DEBIT',
                'amount' => $amountMinor,
            ],
            [
                'wallet_id' => $wallet->id,
                'entry_type' => 'CREDIT',
                'amount' => $amountMinor,
            ],
        ]);

        // 4. Mark transaction as completed
        $tx->update([
            'status' => 'completed',
            'metadata' => array_merge($tx->metadata ?? [], [
                'gateway_reference' => $response->gatewayReference,
                'raw_gateway_payload' => $response->rawPayload,
            ]),
        ]);

        // 5. Audit log
        AuditLogService::record(
            action: 'deposit_completed',
            actorUserId: $user->id,
            targetType: Transaction::class,
            targetId: $tx->id,
            newValues: [
                'amount' => $amountMinor,
                'gateway_reference' => $response->gatewayReference,
                'wallet_id' => $wallet->id,
            ]
        );

        return $tx;
    }
}

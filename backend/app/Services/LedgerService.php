<?php

namespace App\Services;

use App\Exceptions\InsufficientFundsException;
use App\Exceptions\WalletFrozenException;
use App\Models\LedgerEntry;
use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use LogicException;

class LedgerService
{
    /**
     * Post a balanced set of debit and credit ledger entries atomically.
     *
     * @param Transaction $tx
     * @param array<int, array{wallet_id: int, entry_type: string, amount: int}> $entries
     * @return array<int, LedgerEntry>
     *
     * @throws LogicException
     * @throws WalletFrozenException
     * @throws InsufficientFundsException
     */
    public function postEntries(Transaction $tx, array $entries): array
    {
        if (empty($entries)) {
            throw new LogicException('Ledger entries cannot be empty.');
        }

        // 1. Validate SUM(DEBIT) === SUM(CREDIT) before performing any write operations
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($entries as $entry) {
            $amount = (int) $entry['amount'];
            if ($amount <= 0) {
                throw new LogicException("Ledger entry amount must be a positive integer minor unit, got {$amount}.");
            }

            $type = strtoupper((string) $entry['entry_type']);
            if ($type === 'DEBIT') {
                $totalDebit += $amount;
            } elseif ($type === 'CREDIT') {
                $totalCredit += $amount;
            } else {
                throw new LogicException("Invalid ledger entry type: {$type}. Must be DEBIT or CREDIT.");
            }
        }

        if ($totalDebit !== $totalCredit) {
            throw new LogicException(
                "Double-entry bookkeeping mismatch: Total DEBIT ({$totalDebit}) does not equal Total CREDIT ({$totalCredit})."
            );
        }

        // 2. Extract unique wallet IDs and sort in ascending order to prevent deadlocks
        $walletIds = array_values(array_unique(array_map('intval', array_column($entries, 'wallet_id'))));
        sort($walletIds);

        // 3. Execute inside DB::transaction with up to 3 automatic deadlock retries
        return DB::transaction(function () use ($tx, $entries, $walletIds) {
            // Lock all involved wallets in deterministic ascending order
            $wallets = Wallet::whereIn('id', $walletIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // Verify all wallets exist
            foreach ($walletIds as $id) {
                if (! $wallets->has($id)) {
                    throw new LogicException("Wallet ID {$id} not found during ledger execution.");
                }
            }

            $createdEntries = [];

            // Process each entry in sequence, tracking running balances
            foreach ($entries as $entry) {
                $walletId = (int) $entry['wallet_id'];
                $amount = (int) $entry['amount'];
                $entryType = strtoupper((string) $entry['entry_type']);

                /** @var Wallet $wallet */
                $wallet = $wallets->get($walletId);

                // Check wallet status
                if ($wallet->status === 'frozen') {
                    throw new WalletFrozenException(
                        "Wallet {$wallet->wallet_code} is currently frozen. No ledger movements permitted."
                    );
                }

                // Check sufficient balance for user wallets on DEBIT
                if ($entryType === 'DEBIT' && $wallet->type === 'user') {
                    if ($wallet->balance < $amount) {
                        throw new InsufficientFundsException(
                            "Insufficient balance in wallet {$wallet->wallet_code}. Available: " .
                            number_format($wallet->balance / 100, 2) . " PKR, Required: " .
                            number_format($amount / 100, 2) . " PKR."
                        );
                    }
                }

                // Calculate balance_after
                // Credit increases balance, Debit decreases balance
                $newBalance = $entryType === 'CREDIT'
                    ? $wallet->balance + $amount
                    : $wallet->balance - $amount;

                // Create immutable ledger entry
                $ledgerEntry = LedgerEntry::create([
                    'transaction_id' => $tx->id,
                    'wallet_id' => $wallet->id,
                    'entry_type' => $entryType,
                    'amount' => $amount,
                    'balance_after' => $newBalance,
                    'created_at' => now(),
                ]);

                // Update cached balance on wallet model and in memory collection
                $wallet->balance = $newBalance;
                $wallet->save();

                $createdEntries[] = $ledgerEntry;
            }

            return $createdEntries;
        }, 3);
    }
}

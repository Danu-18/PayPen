<?php

namespace App\Services;

use App\Models\LedgerEntry;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;

class ReconciliationService
{
    /**
     * Perform complete double-entry liquidity and ledger reconciliation.
     *
     * @return array{
     *     is_balanced: bool,
     *     global_drift: int,
     *     circulating_user_funds: int,
     *     total_deposits: int,
     *     platform_fee_revenue: int,
     *     wallets_checked: int,
     *     discrepancies: array<int, array{wallet_id: int, wallet_code: string, cached_balance: int, ledger_balance: int, drift: int}>,
     *     checked_at: string
     * }
     */
    public function audit(): array
    {
        // 1. Check global balance sum across all wallets (must be exactly 0)
        $globalSum = (int) Wallet::sum('balance');

        // 2. Compute ledger entries aggregate per wallet: SUM(CREDIT) - SUM(DEBIT)
        $ledgerSums = LedgerEntry::select(
            'wallet_id',
            DB::raw("SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END) as ledger_balance")
        )
            ->groupBy('wallet_id')
            ->pluck('ledger_balance', 'wallet_id')
            ->map(fn ($val) => (int) $val);

        $wallets = Wallet::all();
        $discrepancies = [];

        foreach ($wallets as $wallet) {
            $cachedBalance = (int) $wallet->balance;
            $ledgerBalance = (int) ($ledgerSums->get($wallet->id) ?? 0);

            if ($cachedBalance !== $ledgerBalance) {
                $discrepancies[] = [
                    'wallet_id' => $wallet->id,
                    'wallet_code' => $wallet->wallet_code,
                    'wallet_name' => $wallet->name,
                    'cached_balance' => $cachedBalance,
                    'ledger_balance' => $ledgerBalance,
                    'drift' => $cachedBalance - $ledgerBalance,
                ];
            }
        }

        // 3. Platform aggregates
        $circulatingUserFunds = (int) Wallet::where('type', 'user')->sum('balance');
        $clearingBalance = (int) (Wallet::where('wallet_code', 'PP-SYS-CLEARING')->value('balance') ?? 0);
        $totalDeposits = abs($clearingBalance);
        $platformFeeRevenue = (int) (Wallet::where('wallet_code', 'PP-SYS-REVENUE')->value('balance') ?? 0);

        $isBalanced = ($globalSum === 0) && empty($discrepancies);

        return [
            'is_balanced' => $isBalanced,
            'global_drift' => $globalSum,
            'circulating_user_funds' => $circulatingUserFunds,
            'formatted_circulating_user_funds' => number_format($circulatingUserFunds / 100, 2),
            'total_deposits' => $totalDeposits,
            'formatted_total_deposits' => number_format($totalDeposits / 100, 2),
            'platform_fee_revenue' => $platformFeeRevenue,
            'formatted_platform_fee_revenue' => number_format($platformFeeRevenue / 100, 2),
            'wallets_checked' => $wallets->count(),
            'discrepancies' => $discrepancies,
            'checked_at' => now()->toIso8601String(),
        ];
    }
}

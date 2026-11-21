'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { useGetReconciliationQuery } from '@/src/redux/api/adminApi';
import { useAppSelector } from '@/src/redux/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Coins,
  ArrowDownToLine,
  Receipt,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, isFetching, refetch } = useGetReconciliationQuery();

  if (user && user.role !== 'admin') {
    return (
      <AuthGuard>
        <AppShell>
          <div className="max-w-md mx-auto text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Restricted Access</h1>
            <p className="text-sm text-slate-500">
              This portal is strictly restricted to PayPen System Administrators.
            </p>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const report = data?.data;
  const isBalanced = report?.is_balanced;

  const handleRefresh = async () => {
    try {
      await refetch().unwrap();
      toast.success('Liquidity reconciliation audit refreshed');
    } catch {
      toast.error('Failed to refresh reconciliation audit');
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Liquidity & Ledger Reconciliation
                </h1>
                <Badge variant="info">Admin Level 1</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Real-time mathematical verification of double-entry ledger parity across all institutional wallets
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isFetching}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
            >
              Re-Run Audit
            </Button>
          </div>

          {/* Reconciliation Status Banner */}
          {isLoading ? (
            <Skeleton className="w-full h-24 rounded-2xl" />
          ) : isBalanced ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900 tracking-tight">
                    LEDGER BALANCED (0.00 PKR DRIFT)
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Zero mathematical discrepancies across all {report?.wallets_checked} wallets. Every credit entry equals its corresponding debit.
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-emerald-800 shrink-0 font-mono">
                Checked: {report?.checked_at ? new Date(report.checked_at).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900 tracking-tight">
                  HIGH PRIORITY: LEDGER IMBALANCE DETECTED
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Mathematical drift detected: PKR {(report?.global_drift || 0) / 100}. Immediate administrative inspection required.
                </p>
              </div>
            </div>
          )}

          {/* Key Liquidity Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Circulating Liquidity */}
            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    User Circulating Funds
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  {isLoading ? (
                    <Skeleton className="w-24 h-7" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      PKR {report?.formatted_circulating_user_funds || '0.00'}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Aggregated customer balances</p>
                </div>
              </CardContent>
            </Card>

            {/* Total Completed Deposits */}
            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Inbound Deposits
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  {isLoading ? (
                    <Skeleton className="w-24 h-7" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      PKR {report?.formatted_total_deposits || '0.00'}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Clearing wallet liability</p>
                </div>
              </CardContent>
            </Card>

            {/* Platform Fee Revenue */}
            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Platform Revenue (1.5%)
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  {isLoading ? (
                    <Skeleton className="w-24 h-7" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      PKR {report?.formatted_platform_fee_revenue || '0.00'}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Accumulated system revenue</p>
                </div>
              </CardContent>
            </Card>

            {/* Mathematical Drift */}
            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Global Net Balance
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  {isLoading ? (
                    <Skeleton className="w-24 h-7" />
                  ) : (
                    <p className={`text-2xl font-bold tracking-tight ${report?.global_drift === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {report?.global_drift === 0 ? '0.00 PKR' : `${(report?.global_drift || 0) / 100} PKR`}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Target: EXACTLY 0.00</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Discrepancy Inspection Table */}
          {report?.discrepancies && report.discrepancies.length > 0 && (
            <Card className="border-rose-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-rose-800">Discrepant Wallets</CardTitle>
                <CardDescription>
                  The following wallets exhibit a drift between cached balance and ledger summation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3">Wallet ID</th>
                        <th className="p-3">Wallet Code</th>
                        <th className="p-3">Wallet Name</th>
                        <th className="p-3">Cached Balance</th>
                        <th className="p-3">Ledger Balance</th>
                        <th className="p-3">Drift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.discrepancies.map((d) => (
                        <tr key={d.wallet_id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono">{d.wallet_id}</td>
                          <td className="p-3 font-mono font-bold">{d.wallet_code}</td>
                          <td className="p-3">{d.wallet_name}</td>
                          <td className="p-3 font-mono font-semibold">PKR {(d.cached_balance / 100).toFixed(2)}</td>
                          <td className="p-3 font-mono font-semibold">PKR {(d.ledger_balance / 100).toFixed(2)}</td>
                          <td className="p-3 font-mono font-bold text-rose-600">PKR {(d.drift / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Institutional Architecture Card */}
          <Card className="border-slate-200 shadow-xs bg-slate-900 text-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm font-semibold text-white">Institutional Accounting Invariants</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-300">
              <p>PayPen operates under a closed-loop double-entry zero-sum invariant:</p>
              <div className="font-mono text-xs bg-black/40 p-3 rounded-xl border border-white/10 text-emerald-400 space-y-1">
                <p>SUM(Wallets.balance) === 0</p>
                <p>User_Liquidity + System_Revenue === abs(System_Clearing_Liability)</p>
              </div>
              <p className="text-[11px] text-slate-400">
                All ledger records are immutable and append-only. Floating-point types are strictly prohibited in the engine.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

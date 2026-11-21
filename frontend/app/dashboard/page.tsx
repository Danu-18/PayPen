'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { useGetProfileQuery } from '@/src/redux/api/profileApi';
import { updateUser } from '@/src/redux/slices/authSlice';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { CurrencyDisplay } from '@/src/components/ui/CurrencyDisplay';
import {
  Copy,
  Check,
  ShieldAlert,
  ArrowDownToLine,
  Send,
  Receipt,
  HandCoins,
  History,
  CreditCard,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user, wallet, token } = useAppSelector((state) => state.auth);
  const { data: profileData, refetch } = useGetProfileQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  });

  const [copied, setCopied] = useState(false);
  const [modalAction, setModalAction] = useState<string | null>(null);

  // Sync profile data to redux state when fetched (strictly for currently logged in user)
  React.useEffect(() => {
    if (profileData?.user && user && profileData.user.id === user.id) {
      dispatch(updateUser(profileData.user));
    }
  }, [profileData, user, dispatch]);

  const activeWallet = (profileData?.user?.id === user?.id ? profileData?.wallet : null) || wallet || user?.wallet;
  const currentUser = (profileData?.user?.id === user?.id ? profileData?.user : null) || user;

  const handleCopyWalletCode = () => {
    if (activeWallet?.wallet_code) {
      navigator.clipboard.writeText(activeWallet.wallet_code);
      setCopied(true);
      toast.success('Wallet ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickActions = [
    {
      id: 'deposit',
      title: 'Add Money',
      subtitle: 'Bank deposit & balance top-up',
      icon: ArrowDownToLine,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/80',
      badge: 'Sprint 2',
    },
    {
      id: 'send',
      title: 'Send Money',
      subtitle: 'Instant P2P transfer by Wallet ID',
      icon: Send,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100/80',
      badge: 'Sprint 2',
    },
    {
      id: 'bills',
      title: 'Pay Bills',
      subtitle: 'Electricity, Gas, Internet & Mobile',
      icon: Receipt,
      color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100/80',
      badge: 'Sprint 2',
    },
    {
      id: 'requests',
      title: 'Request Money',
      subtitle: 'Create & manage payment requests',
      icon: HandCoins,
      color: 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100/80',
      badge: 'Sprint 3',
    },
  ];

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6 sm:space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Financial Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back, <strong className="text-slate-800">{currentUser?.name}</strong>. Here is
                your real-time digital wallet overview.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Ledger Live
              </Badge>
              <button
                onClick={() => refetch()}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* MPIN Warning Banner (SCRUM-17 / Sprint 1 Requirement) */}
          {!currentUser?.has_mpin && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Action Required: Set Up Your 4-Digit MPIN
                  </h4>
                  <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                    Your wallet is active, but you must set a 4-digit security PIN before executing peer-to-peer transfers or paying utility bills.
                  </p>
                </div>
              </div>
              <Link href="/profile#mpin" className="shrink-0 w-full sm:w-auto">
                <Button size="sm" variant="secondary" className="w-full sm:w-auto bg-amber-900 hover:bg-amber-950 text-white border-0">
                  Set Up MPIN Now
                </Button>
              </Link>
            </div>
          )}

          {/* Hero Virtual Wallet Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800/60">
            {/* Background Ambient Glows */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between min-h-[220px]">
              {/* Card Top Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-amber-200 to-amber-400 border border-amber-100/60 shadow-sm flex items-center justify-center">
                    <div className="w-8 h-5 border border-amber-900/30 rounded-xs grid grid-cols-2 gap-0.5 p-0.5">
                      <div className="border-r border-b border-amber-900/30" />
                      <div className="border-b border-amber-900/30" />
                      <div className="border-r border-amber-900/30" />
                      <div />
                    </div>
                  </div>
                  <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeWallet?.status === 'active' ? 'Active Wallet' : 'Frozen'}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10">
                    {activeWallet?.currency || 'PKR'}
                  </span>
                </div>
              </div>

              {/* Card Balance (Hero Display in tabular-nums) */}
              <div className="my-6">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                  Available Balance
                </p>
                <div className="text-white">
                  <CurrencyDisplay
                    amountMinor={activeWallet?.balance ?? 0}
                    currency={activeWallet?.currency || 'PKR'}
                    size="hero"
                    className="text-white font-mono"
                  />
                </div>
              </div>

              {/* Card Bottom Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Cardholder</p>
                  <p className="text-sm font-semibold tracking-wide text-white uppercase mt-0.5">
                    {currentUser?.name || 'Authorized User'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 text-right sm:text-right">
                      Wallet ID
                    </p>
                    <p className="text-sm font-mono font-bold tracking-wider text-emerald-300">
                      {activeWallet?.wallet_code || 'PP-PROVISIONING'}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyWalletCode}
                    title="Copy Wallet ID"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Grid */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4">Quick Financial Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => setModalAction(action.id)}
                    className="flex flex-col items-start p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 text-left cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${action.color} transition-transform group-hover:scale-105`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="neutral" className="text-[10px] font-semibold">
                        {action.badge}
                      </Badge>
                    </div>
                    <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {action.title}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 line-clamp-1">{action.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-500" />
                  <span>Recent Ledger Activity</span>
                </CardTitle>
                <CardDescription>
                  Real-time transaction entries recorded on your double-entry ledger
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<CreditCard className="w-6 h-6 text-slate-400" />}
                title="No Transactions Yet"
                description="Your double-entry ledger is clean and ready. In Sprint 2, once deposits or transfers are initiated, immutable debit and credit entries will populate here in real-time."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalAction('deposit')}
                  >
                    Learn about adding funds
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Informative Modal for Sprint 2/3 Feature Preview */}
        <Modal
          isOpen={modalAction !== null}
          onClose={() => setModalAction(null)}
          title={
            modalAction === 'deposit'
              ? 'Add Money (Deposit)'
              : modalAction === 'send'
              ? 'Send Money (P2P Transfer)'
              : modalAction === 'bills'
              ? 'Pay Utility Bills'
              : 'Money Requests'
          }
          description="Database schema & models are verified and ready for Sprint 2 execution."
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Backend Database Foundation Ready</span>
              </div>
              <p>
                All underlying database tables (<code>transactions</code>, <code>ledger_entries</code>,{' '}
                <code>utility_bills</code>, and <code>money_requests</code>) are fully migrated and seeded in this step.
              </p>
              <p>
                The financial transfer controllers, idempotency guards, and payment gateways will be wired in Sprint 2!
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setModalAction(null)}>
                Got it
              </Button>
            </div>
          </div>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { useTransferMutation } from '@/src/redux/api/transactionApi';
import { useAppSelector } from '@/src/redux/hooks';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Modal } from '@/src/components/ui/Modal';
import { Badge } from '@/src/components/ui/Badge';
import { CurrencyDisplay } from '@/src/components/ui/CurrencyDisplay';
import { toast } from 'sonner';
import {
  Send,
  Mail,
  Lock,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Receipt,
  Wallet as WalletIcon,
} from 'lucide-react';

export default function SendPage() {
  const router = useRouter();
  const { user, wallet } = useAppSelector((state) => state.auth);
  const [transferApi, { isLoading }] = useTransferMutation();

  const [recipient, setRecipient] = useState('');
  const [amountPkr, setAmountPkr] = useState('500');
  const [note, setNote] = useState('');
  const [mpin, setMpin] = useState('');

  // Admin guard: Admins do not execute consumer transfers
  React.useEffect(() => {
    if (user?.role === 'admin') {
      window.location.replace('/admin');
    }
  }, [user]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const quickAmounts = [200, 500, 1000, 2500, 5000];

  // Mathematical integer calculations for live fee breakdown
  const parsedPkr = parseFloat(amountPkr) || 0;
  const amountMinor = Math.round(parsedPkr * 100);
  // 1.5% integer fee calculation
  const feeMinor = amountMinor > 0 ? Math.floor((amountMinor * 150 + 5000) / 10000) : 0;
  const totalDebitMinor = amountMinor + feeMinor;

  const currentBalance = wallet?.balance || 0;
  const isInsufficient = totalDebitMinor > currentBalance;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setErrorBanner('Please enter a valid recipient email address or Wallet ID.');
      return;
    }

    const isSelfEmail = trimmedRecipient.toLowerCase() === user?.email.toLowerCase();
    const isSelfWallet =
      wallet?.wallet_code &&
      (trimmedRecipient.toUpperCase() === wallet.wallet_code.toUpperCase() ||
       trimmedRecipient.toUpperCase() === wallet.wallet_code.replace(/^PP-/, '').toUpperCase());

    if (isSelfEmail || isSelfWallet) {
      setErrorBanner('You cannot transfer funds to your own wallet.');
      return;
    }

    if (parsedPkr <= 0) {
      setErrorBanner('Transfer amount must be greater than zero.');
      return;
    }

    if (isInsufficient) {
      setErrorBanner(
        `Insufficient balance. You need PKR ${(totalDebitMinor / 100).toFixed(2)}, but your wallet currently holds PKR ${(currentBalance / 100).toFixed(2)}.`
      );
      return;
    }

    if (!user?.has_mpin) {
      setErrorBanner('You must set up a 4-digit security MPIN in your Profile before sending money.');
      return;
    }

    setMpin('');
    setShowConfirmModal(true);
  };

  const handleAuthorizeTransfer = async () => {
    if (mpin.length !== 4 || !/^\d{4}$/.test(mpin)) {
      toast.error('Please enter a valid 4-digit numeric MPIN.');
      return;
    }

    // Generate unique UUID for Idempotency protection
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

    try {
      const res = await transferApi({
        data: {
          recipient: recipient.trim(),
          recipient_email: recipient.trim(),
          amount: amountMinor,
          mpin,
          note: note ? note.trim() : undefined,
        },
        idempotencyKey,
      }).unwrap();

      setShowConfirmModal(false);
      toast.success(res.message || 'P2P transfer completed successfully!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; code?: string } };
      const msg = apiErr.data?.message || 'Transfer failed. Please check your credentials and balance.';
      setErrorBanner(msg);
      toast.error(msg);
      setShowConfirmModal(false);
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Send Money (P2P)</h1>
                <Badge variant="success">Instant PKR Settlement</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Zero-delay wallet transfers to any registered PayPen user by Email or Wallet ID
              </p>
            </div>

            {/* Current Balance Pill */}
            <div className="bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                PKR
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Balance</p>
                <CurrencyDisplay amountMinor={currentBalance} className="text-base font-bold text-slate-900" />
              </div>
            </div>
          </div>

          {/* Missing MPIN Alert */}
          {!user?.has_mpin && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">4-Digit Security MPIN Required</p>
                <p className="text-xs text-amber-800">
                  To protect your funds against unauthorized transactions, you must set up your 4-digit MPIN before sending money.
                </p>
                <div className="pt-2">
                  <Link href="/profile">
                    <Button size="sm" variant="outline" className="bg-white text-amber-900 border-amber-300">
                      Set Up MPIN Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Details</CardTitle>
                  <CardDescription>
                    Enter recipient credentials (Email or Wallet ID) and payment amount
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOpenConfirm} className="space-y-5">
                    {/* Recipient Email or Wallet ID */}
                    <div>
                      <Input
                        label="Recipient (Email Address or Wallet ID)"
                        type="text"
                        placeholder="e.g. user@example.com or PP-0A91CCC1"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        leftIcon={
                          recipient.includes('@') ? (
                            <Mail className="w-4 h-4 text-slate-400" />
                          ) : (
                            <WalletIcon className="w-4 h-4 text-slate-400" />
                          )
                        }
                        required
                      />
                      <p className="text-[11px] text-slate-400 mt-1 pl-1">
                        Enter recipient's registered email or their unique 8-character PayPen Wallet ID.
                      </p>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Amount to Send (PKR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          PKR
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={amountPkr}
                          onChange={(e) => setAmountPkr(e.target.value)}
                          placeholder="500"
                          className="w-full pl-14 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          required
                        />
                      </div>

                      {/* Quick Pills */}
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {quickAmounts.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAmountPkr(amt.toString())}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                              amountPkr === amt.toString()
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            PKR {amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Note / Purpose */}
                    <Input
                      label="Payment Note / Description (Optional)"
                      type="text"
                      placeholder="e.g. Dinner bill split, rent, freelancing"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />

                    {/* Error Banner */}
                    {errorBanner && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Transfer Notice:</strong>
                          {errorBanner}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isInsufficient || !user?.has_mpin}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Review & Authorize Transfer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Live Fee Breakdown & Security Sidebar */}
            <div className="space-y-6">
              {/* Fee Breakdown Card */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-sm font-semibold">Live Cost Breakdown</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Transfer Amount</span>
                    <span className="font-semibold text-slate-900">PKR {parsedPkr.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      Platform Fee (1.5%)
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                    <span className="font-semibold text-slate-900">PKR {(feeMinor / 100).toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>Total Debit</span>
                    <span className={isInsufficient ? 'text-rose-600' : 'text-emerald-700'}>
                      PKR {(totalDebitMinor / 100).toFixed(2)}
                    </span>
                  </div>

                  {isInsufficient && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      ⚠️ Exceeds current available balance (PKR {(currentBalance / 100).toFixed(2)}).
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Security Safeguards */}
              <Card className="border-slate-200/80 shadow-sm bg-slate-50/50">
                <CardContent className="p-4 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Fintech Safeguards Active</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-500 text-[11px]">
                    <li>4-digit MPIN authorization on all outbound transfers</li>
                    <li>Locked after 5 consecutive failed MPIN attempts</li>
                    <li>Pessimistic locking prevents overdrafts or race conditions</li>
                    <li>Automatic audit logging and fraud velocity inspection</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 4-Digit MPIN Authorization Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Authorize Transfer"
          description="Enter your 4-digit security MPIN to execute this irreversible transaction."
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-semibold text-slate-800 font-mono">{recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer Amount:</span>
                <span className="font-semibold text-slate-800">PKR {parsedPkr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Fee (1.5%):</span>
                <span className="font-semibold text-slate-800">PKR {(feeMinor / 100).toFixed(2)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Total Debit:</span>
                <span className="text-emerald-700">PKR {(totalDebitMinor / 100).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
                Enter 4-Digit Security MPIN
              </label>
              <div className="flex justify-center">
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-40 text-center tracking-[0.5em] text-2xl font-bold py-2 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="w-1/2"
                onClick={handleAuthorizeTransfer}
                isLoading={isLoading}
                disabled={mpin.length !== 4}
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}

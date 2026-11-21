'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { useDepositMutation } from '@/src/redux/api/transactionApi';
import { useAppSelector } from '@/src/redux/hooks';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { CurrencyDisplay } from '@/src/components/ui/CurrencyDisplay';
import { toast } from 'sonner';
import {
  CreditCard,
  ShieldCheck,
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  Calendar,
  Lock,
} from 'lucide-react';

export default function DepositPage() {
  const router = useRouter();
  const { user, wallet } = useAppSelector((state) => state.auth);
  const [depositApi, { isLoading }] = useDepositMutation();

  // Admin guard: Admins do not execute consumer deposits
  React.useEffect(() => {
    if (user?.role === 'admin') {
      window.location.replace('/admin');
    }
  }, [user]);

  const [amountPkr, setAmountPkr] = useState<string>('1000');
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [expMonth, setExpMonth] = useState<string>('12');
  const [expYear, setExpYear] = useState<string>('2028');
  const [cvc, setCvc] = useState<string>('123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  const handleCardChipClick = (num: string, expM: string, expY: string, testCvc: string) => {
    setCardNumber(num);
    setExpMonth(expM);
    setExpYear(expY);
    setCvc(testCvc);
    setErrorMsg(null);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedPkr = parseFloat(amountPkr);
    if (isNaN(parsedPkr) || parsedPkr <= 0) {
      setErrorMsg('Please enter a valid deposit amount in PKR.');
      return;
    }

    const cleanCard = cardNumber.replace(/\D/g, '');
    if (cleanCard.length !== 16) {
      setErrorMsg('Card number must be exactly 16 digits.');
      return;
    }

    // Convert PKR to integer minor units (Paisa)
    const amountMinor = Math.round(parsedPkr * 100);

    // Generate unique UUID for Idempotency protection
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

    try {
      const res = await depositApi({
        data: {
          amount: amountMinor,
          card_number: cleanCard,
          exp_month: expMonth,
          exp_year: expYear,
          cvc,
        },
        idempotencyKey,
      }).unwrap();

      toast.success(res.message || 'Deposit completed successfully!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; code?: string } };
      const msg = apiErr.data?.message || 'Deposit transaction declined by gateway.';
      setErrorMsg(msg);
      toast.error(msg);
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
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deposit Funds</h1>
                <Badge variant="success">Sandbox Live</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Top up your PayPen PKR digital wallet instantly via bank card simulation
              </p>
            </div>

            {/* Current Balance Pill */}
            <div className="bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                PKR
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Balance</p>
                <CurrencyDisplay amountMinor={wallet?.balance || 0} className="text-base font-bold text-slate-900" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Card Payment Details</CardTitle>
                  <CardDescription>
                    All deposits are processed through institutional double-entry clearing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDeposit} className="space-y-5">
                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Deposit Amount (PKR)
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
                          placeholder="1000"
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

                    {/* Card Number Input */}
                    <div>
                      <Input
                        label="Card Number"
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        leftIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
                        required
                      />
                    </div>

                    {/* Expiry & CVC */}
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="Exp Month"
                        type="text"
                        placeholder="MM"
                        maxLength={2}
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        leftIcon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                        required
                      />
                      <Input
                        label="Exp Year"
                        type="text"
                        placeholder="YYYY"
                        maxLength={4}
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        required
                      />
                      <Input
                        label="CVC / CVV"
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        leftIcon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
                        required
                      />
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Deposit Declined:</strong>
                          {errorMsg}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      isLoading={isLoading}
                      rightIcon={<ArrowDownToLine className="w-4 h-4" />}
                    >
                      Authorize & Deposit PKR {parseFloat(amountPkr || '0').toLocaleString()}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Test Cards & Info Column */}
            <div className="space-y-6">
              {/* Test Card Chips */}
              <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-900 to-slate-950 text-white">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-sm font-semibold text-white">Deterministic Sandbox Cards</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 text-xs">
                    Click any chip below to autofill and test instant approval or declined gateway responses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    onClick={() => handleCardChipClick('4242 4242 4242 4242', '12', '2028', '123')}
                    className="p-3 bg-white/10 hover:bg-white/15 border border-emerald-500/40 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Card: Approval (Success)
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                        VISA
                      </span>
                    </div>
                    <p className="font-mono text-xs text-white mt-1">4242 4242 4242 4242</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Expires: 12/2028 • CVC: 123</p>
                  </div>

                  <div
                    onClick={() => handleCardChipClick('4000 0000 0000 0002', '10', '2027', '999')}
                    className="p-3 bg-white/10 hover:bg-white/15 border border-rose-500/40 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Card: Insufficient Card Funds
                      </span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">
                        DECLINE
                      </span>
                    </div>
                    <p className="font-mono text-xs text-white mt-1">4000 0000 0000 0002</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Triggers simulated 422 response</p>
                  </div>
                </CardContent>
              </Card>

              {/* Ledger Transparency Note */}
              <Card className="border-slate-200/80 shadow-sm bg-slate-50/50">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Double-Entry Assurance</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Deposits execute an atomic double-entry transaction:
                  </p>
                  <div className="space-y-1.5 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                    <p className="text-rose-700">DEBIT : PP-SYS-CLEARING</p>
                    <p className="text-emerald-700">CREDIT: {wallet?.wallet_code || 'YOUR_WALLET'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { useGetProfileQuery, useUpdateMpinMutation } from '@/src/redux/api/profileApi';
import { updateUser } from '@/src/redux/slices/authSlice';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { CurrencyDisplay } from '@/src/components/ui/CurrencyDisplay';
import {
  User,
  Wallet as WalletIcon,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Lock,
  Calendar,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, wallet, token } = useAppSelector((state) => state.auth);
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });
  const [updateMpinApi, { isLoading: isUpdatingMpin }] = useUpdateMpinMutation();

  const [copied, setCopied] = useState(false);

  // MPIN Form State
  const [mpinForm, setMpinForm] = useState({
    mpin: '',
    mpin_confirmation: '',
    current_password: '',
  });

  const [mpinErrors, setMpinErrors] = useState<Record<string, string>>({});

  const currentUser = (profileData?.user?.id === user?.id ? profileData?.user : null) || user;
  const currentWallet = (profileData?.user?.id === user?.id ? profileData?.wallet : null) || wallet || user?.wallet;

  const handleCopyWalletCode = () => {
    if (currentWallet?.wallet_code) {
      navigator.clipboard.writeText(currentWallet.wallet_code);
      setCopied(true);
      toast.success('Wallet ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMpinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpinErrors({});

    // Client-side quick check
    if (!/^\d{4}$/.test(mpinForm.mpin)) {
      setMpinErrors({ mpin: 'MPIN must be exactly 4 numeric digits' });
      return;
    }

    if (mpinForm.mpin !== mpinForm.mpin_confirmation) {
      setMpinErrors({ mpin_confirmation: 'MPIN confirmation does not match' });
      return;
    }

    if (currentUser?.has_mpin && !mpinForm.current_password) {
      setMpinErrors({ current_password: 'Your current account password is required' });
      return;
    }

    try {
      const res = await updateMpinApi({
        mpin: mpinForm.mpin,
        mpin_confirmation: mpinForm.mpin_confirmation,
        current_password: mpinForm.current_password || undefined,
      }).unwrap();

      dispatch(updateUser(res.user));
      toast.success(res.message || 'MPIN updated successfully!');
      setMpinForm({ mpin: '', mpin_confirmation: '', current_password: '' });
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      if (apiErr.data?.errors) {
        const backendErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.data.errors)) {
          backendErrors[key] = msgs[0];
        }
        setMpinErrors(backendErrors);
      } else {
        toast.error(apiErr.data?.message || 'Failed to save MPIN. Please verify your details.');
      }
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6 sm:space-y-8 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Account & Security Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal credentials, digital wallet identifiers, and 4-digit transaction MPIN.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Identity Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Personal Profile</span>
                  </CardTitle>
                  <Badge variant={currentUser?.role === 'admin' ? 'danger' : 'neutral'}>
                    {currentUser?.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold text-base border border-emerald-600/20">
                    {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'PP'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{currentUser?.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {currentUser?.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-1">Email Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-1">Member Since</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5" />
                      {currentUser?.created_at
                        ? new Date(currentUser.created_at).toLocaleDateString()
                        : 'November 2026'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <WalletIcon className="w-4 h-4 text-emerald-600" />
                    <span>Primary PKR Wallet</span>
                  </CardTitle>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Wallet ID Code
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-300">
                      {currentWallet?.wallet_code || 'PP-PROVISIONING'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyWalletCode}
                    title="Copy Wallet ID"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-1">Ledger Balance</span>
                    <CurrencyDisplay
                      amountMinor={currentWallet?.balance ?? 0}
                      currency={currentWallet?.currency || 'PKR'}
                      size="sm"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-1">Currency Code</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {currentWallet?.currency || 'PKR'} (Pakistani Rupee)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4-Digit MPIN Setup/Update Section (SCRUM-17 / Sprint 1 Requirement) */}
          <Card id="mpin" className="border-slate-200 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-emerald-600" />
                    <span>4-Digit Transaction MPIN</span>
                  </CardTitle>
                  <CardDescription>
                    {currentUser?.has_mpin
                      ? 'Your 4-digit MPIN is active. You can update it anytime with your account password.'
                      : 'Create your 4-digit numeric MPIN to secure transfers and bill payments.'}
                  </CardDescription>
                </div>
                <Badge variant={currentUser?.has_mpin ? 'success' : 'warning'}>
                  {currentUser?.has_mpin ? 'MPIN Configured' : 'MPIN Not Set'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMpinSubmit} className="space-y-4 max-w-md">
                {currentUser?.has_mpin && (
                  <Input
                    label="Current Account Password"
                    id="current_password"
                    type="password"
                    placeholder="Enter your account password"
                    value={mpinForm.current_password}
                    onChange={(e) =>
                      setMpinForm({ ...mpinForm, current_password: e.target.value })
                    }
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={mpinErrors.current_password}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={currentUser?.has_mpin ? 'New 4-Digit MPIN' : 'Enter 4-Digit MPIN'}
                    id="mpin"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={mpinForm.mpin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setMpinForm({ ...mpinForm, mpin: val });
                    }}
                    error={mpinErrors.mpin}
                    helperText="Exactly 4 numeric digits"
                  />

                  <Input
                    label="Confirm 4-Digit MPIN"
                    id="mpin_confirmation"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={mpinForm.mpin_confirmation}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setMpinForm({ ...mpinForm, mpin_confirmation: val });
                    }}
                    error={mpinErrors.mpin_confirmation}
                    helperText="Must match MPIN"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isUpdatingMpin}
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    {currentUser?.has_mpin ? 'Update MPIN' : 'Save 4-Digit MPIN'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

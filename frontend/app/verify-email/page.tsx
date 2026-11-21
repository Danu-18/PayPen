'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { useResendVerificationMutation } from '@/src/redux/api/authApi';
import { useLazyGetProfileQuery } from '@/src/redux/api/profileApi';
import { logout, updateUser, markVerified } from '@/src/redux/slices/authSlice';
import { baseApi } from '@/src/redux/api/baseApi';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { toast } from 'sonner';
import { MailCheck, RefreshCw, LogOut, ArrowRight, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token, isHydrated } = useAppSelector((state) => state.auth);
  const [resendApi, { isLoading: isResending }] = useResendVerificationMutation();
  const [triggerGetProfile, { isLoading: isCheckingStatus }] = useLazyGetProfileQuery();

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isHydrated) {
      if (!token || !user) {
        router.replace('/login');
      } else if (user.is_email_verified || user.email_verified_at) {
        router.replace('/dashboard');
      }
    }
  }, [isHydrated, token, user, router]);

  // Handle countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendApi().unwrap();
      toast.success('Verification link has been sent to your email.');
      setCooldown(60);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      toast.error(apiErr.data?.message || 'Failed to resend verification link.');
    }
  };

  const handleCheckStatus = async () => {
    try {
      const res = await triggerGetProfile().unwrap();
      if (res?.user?.is_email_verified || res?.user?.email_verified_at) {
        dispatch(updateUser(res.user));
        dispatch(markVerified());
        toast.success('Email confirmed! Loading your wallet dashboard...');
        router.push('/dashboard');
      } else {
        toast.info('Email is not verified yet. Please click the link sent to your inbox.');
      }
    } catch {
      toast.info('Email is still pending verification. Please click the link in your email.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    router.replace('/login');
  };

  if (!isHydrated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-200/60">
            <MailCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h1>
          <p className="text-sm text-slate-500 mt-1">
            Wallet operations are locked until your email address is verified
          </p>
        </div>

        <Card className="border-slate-200/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Verification Email Sent</CardTitle>
            <CardDescription>
              We sent a signed verification link to{' '}
              <strong className="text-slate-800 font-semibold">{user.email}</strong>. Please check
              your inbox and click the link to activate your digital wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email delivery note */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <MailCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-medium block">Live Email Delivery Active:</strong>
                Please check your inbox (and spam/junk folder). Click the signed link in the email to automatically activate your wallet.
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Button
                onClick={handleResend}
                disabled={cooldown > 0}
                isLoading={isResending}
                variant="primary"
                size="md"
                className="w-full"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                {cooldown > 0 ? `Resend Available in ${cooldown}s` : 'Resend Verification Link'}
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={handleCheckStatus}
                isLoading={isCheckingStatus}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Check Status / Refresh
              </Button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 mt-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign in with a different account</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

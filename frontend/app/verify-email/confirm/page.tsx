'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { useLazyVerifyEmailQuery } from '@/src/redux/api/authApi';
import { useLazyGetProfileQuery } from '@/src/redux/api/profileApi';
import { setCredentials, setToken, markVerified, updateUser } from '@/src/redux/slices/authSlice';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent } from '@/src/components/ui/Card';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, LogIn } from 'lucide-react';

function VerifyConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { user, token: currentToken } = useAppSelector((state) => state.auth);

  const [triggerVerify] = useLazyVerifyEmailQuery();
  const [triggerGetProfile] = useLazyGetProfileQuery();

  const [verifiedState, setVerifiedState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const status = searchParams.get('status');
    const tokenParam = searchParams.get('token');
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');

    // 1. If backend passed a fresh authentication token in redirect, save it immediately
    if (tokenParam) {
      dispatch(setToken(tokenParam));
    }

    // 2. If status is success (redirected from Laravel backend verify route)
    if (status === 'success') {
      dispatch(markVerified());

      // Fetch fresh profile & wallet with the active token
      triggerGetProfile()
        .unwrap()
        .then((res) => {
          if (res?.user) {
            dispatch(
              setCredentials({
                user: res.user,
                token: tokenParam || currentToken || (typeof window !== 'undefined' ? localStorage.getItem('paypen_token') || '' : ''),
                wallet: res.wallet,
              })
            );
          }
          setVerifiedState('success');
        })
        .catch(() => {
          // Even if profile fetch network blips, mark verified state
          setVerifiedState('success');
        });
      return;
    }

    // 3. Direct frontend query verification (if signed link is visited directly)
    if (id && hash) {
      const fullQuery = searchParams.toString();
      triggerVerify({ id, hash, urlParams: fullQuery })
        .unwrap()
        .then((res) => {
          if (res.token) {
            dispatch(setToken(res.token));
          }
          if (res.user) {
            dispatch(updateUser(res.user));
          }
          dispatch(markVerified());
          triggerGetProfile();
          setVerifiedState('success');
        })
        .catch((err: unknown) => {
          const apiErr = err as { data?: { message?: string } };
          setErrorMessage(apiErr.data?.message || 'Verification link is invalid or expired.');
          setVerifiedState('error');
        });
    } else {
      dispatch(markVerified());
      setVerifiedState('success');
    }
  }, [searchParams, triggerVerify, triggerGetProfile, dispatch, currentToken]);

  const handleProceedToDashboard = () => {
    setIsNavigating(true);
    dispatch(markVerified());

    const activeToken =
      currentToken ||
      searchParams.get('token') ||
      (typeof window !== 'undefined' ? localStorage.getItem('paypen_token') : null);

    if (activeToken) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-slate-200 shadow-lg text-center p-6">
        <CardContent className="pt-6 space-y-4">
          {verifiedState === 'loading' && (
            <div className="py-8 space-y-3">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-slate-800">Verifying Email...</h2>
              <p className="text-sm text-slate-500">Checking your signed security credentials</p>
            </div>
          )}

          {verifiedState === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Email Verified!</h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Your PayPen digital wallet has been unlocked and is ready for PKR deposits, transfers, and bill payments.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2.5">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleProceedToDashboard}
                  isLoading={isNavigating}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Dashboard
                </Button>

                {!currentToken && !searchParams.get('token') && (
                  <Link href="/login" className="w-full block">
                    <Button variant="outline" size="md" className="w-full" leftIcon={<LogIn className="w-4 h-4" />}>
                      Sign In to Account
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {verifiedState === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Failed</h2>
                <p className="text-sm text-rose-600 mt-1.5">{errorMessage}</p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <Link href="/verify-email" className="w-full block">
                  <Button variant="primary" size="md" className="w-full">
                    Back to Verification Page
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-emerald-600" />}>
        <VerifyConfirmContent />
      </Suspense>
    </div>
  );
}

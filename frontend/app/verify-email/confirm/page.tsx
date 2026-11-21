'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/src/redux/hooks';
import { useLazyVerifyEmailQuery } from '@/src/redux/api/authApi';
import { updateUser } from '@/src/redux/slices/authSlice';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent } from '@/src/components/ui/Card';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

function VerifyConfirmContent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [triggerVerify, { isLoading }] = useLazyVerifyEmailQuery();

  const [verifiedState, setVerifiedState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const status = searchParams.get('status');
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');

    if (status === 'success') {
      setVerifiedState('success');
      return;
    }

    if (id && hash) {
      // Direct query param verification
      const fullQuery = searchParams.toString();
      triggerVerify({ id, hash, urlParams: fullQuery })
        .unwrap()
        .then((res) => {
          if (res.user) {
            dispatch(updateUser(res.user));
          }
          setVerifiedState('success');
        })
        .catch((err: unknown) => {
          const apiErr = err as { data?: { message?: string } };
          setErrorMessage(apiErr.data?.message || 'Verification link is invalid or expired.');
          setVerifiedState('error');
        });
    } else {
      setVerifiedState('success');
    }
  }, [searchParams, triggerVerify, dispatch]);

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

              <div className="pt-4">
                <Link href="/dashboard" className="w-full block">
                  <Button size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Proceed to Dashboard
                  </Button>
                </Link>
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

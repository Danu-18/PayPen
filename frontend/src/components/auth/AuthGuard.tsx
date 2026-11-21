'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/src/redux/hooks';
import { Skeleton } from '@/src/components/ui/Skeleton';

export interface AuthGuardProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export function AuthGuard({ children, requireVerified = true }: AuthGuardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, token, isHydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthResolved = isHydrated || (!!token && !!user);

  useEffect(() => {
    if (!mounted || !isAuthResolved) return;

    if (!token || !user) {
      window.location.replace('/login');
      return;
    }

    if (requireVerified && !user.is_email_verified && !user.email_verified_at) {
      window.location.replace('/verify-email');
    }
  }, [mounted, isAuthResolved, token, user, requireVerified]);

  // Before mounting on client or before auth is resolved from localStorage,
  // render the exact same loading skeleton to ensure perfect server/client hydration match.
  if (!mounted || !isAuthResolved || !token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg animate-pulse">
          PP
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    );
  }

  if (requireVerified && !user.is_email_verified && !user.email_verified_at) {
    return null;
  }

  return <>{children}</>;
}

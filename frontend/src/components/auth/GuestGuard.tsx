'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/src/redux/hooks';

export interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard prevents authenticated users from viewing guest-only routes
 * (such as /login and /register) and prevents back-button navigation into them.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, token, isHydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthResolved = isHydrated || (!!token && !!user);

  useEffect(() => {
    if (!mounted || !isAuthResolved) return;

    if (token && user) {
      if (user.role === 'admin') {
        window.location.replace('/admin');
      } else if (user.is_email_verified || user.email_verified_at) {
        window.location.replace('/dashboard');
      } else {
        window.location.replace('/verify-email');
      }
    }
  }, [mounted, isAuthResolved, token, user]);

  // While checking on client or if already authenticated, don't flash the guest form
  if (mounted && isAuthResolved && token && user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg animate-pulse">
          PP
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

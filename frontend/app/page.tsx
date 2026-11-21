'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/src/redux/hooks';
import { Button } from '@/src/components/ui/Button';
import { ShieldCheck, ArrowRight, Zap, Lock, CreditCard, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, token, isHydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isHydrated && token && user) {
      if (user.is_email_verified || user.email_verified_at) {
        router.push('/dashboard');
      } else {
        router.push('/verify-email');
      }
    }
  }, [isHydrated, token, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900">PayPen</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Fintech v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="hidden sm:inline-flex">
                Open Wallet
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium mb-6 animate-fade-in shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Double-Entry Ledger & Zero Floating-Point Precision</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.1] mb-6">
            The Modern, Zero-Compromise{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Digital Wallet
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Manage your finances in Pakistani Rupees (PKR) with mathematical precision. Auto-provisioned
            wallets, 4-digit MPIN verification, and bank-grade immutable accounting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Free Account
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Sign In to Wallet
              </Button>
            </Link>
          </div>

          {/* Key Fintech Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Instant PKR Settlements</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Automatic zero-balance wallet provisioning upon registration with unique human-readable wallet codes.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Immutable Double-Entry</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Every transaction generates strict DEBIT and CREDIT ledger entries. Financial records cannot be altered or deleted.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">4-Digit MPIN Gate</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Hardware-style security with encrypted MPIN, signed email confirmation, and brute-force lockout safeguards.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 PayPen Fintech Ltd. Built with Laravel 12 & Next.js 16.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Core API Operational
            </span>
            <Link href="/login" className="hover:text-slate-900">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-900">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

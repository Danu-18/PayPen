'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useRegisterMutation } from '@/src/redux/api/authApi';
import { useAppDispatch } from '@/src/redux/hooks';
import { setCredentials } from '@/src/redux/slices/authSlice';
import { baseApi } from '@/src/redux/api/baseApi';
import { GuestGuard } from '@/src/components/auth/GuestGuard';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { toast } from 'sonner';
import { ShieldCheck, Lock, User, Mail, Check, CreditCard, Sparkles } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must include at least one letter')
      .regex(/[0-9]/, 'Password must include at least one number'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerApi, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compute password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-zA-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score; // 0 to 4
  };

  const pwdScore = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const res = await registerApi(formData).unwrap();
      // Clear any prior user's cached queries completely
      dispatch(baseApi.util.resetApiState());
      dispatch(
        setCredentials({
          user: res.user,
          token: res.token,
          wallet: res.wallet,
        })
      );
      toast.success('Registration successful! Please verify your email.');
      window.location.href = '/verify-email';
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      if (apiErr.data?.errors) {
        const backendErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.data.errors)) {
          backendErrors[key] = msgs[0];
        }
        setErrors(backendErrors);
      } else {
        toast.error(apiErr.data?.message || 'Registration failed. Please check your details.');
      }
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen bg-slate-50 flex">
      {/* Left Column: Brand & Security Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/30">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">PayPen</span>
        </div>

        {/* Highlights */}
        <div className="relative z-10 my-auto max-w-md space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Automated Wallet Provisioning
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Create your account and start transacting in seconds.
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Every verified PayPen user receives a unique PKR wallet backed by an immutable ledger.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-white block font-medium">Auto-Provisioned Wallet ID</strong>
                Unique human-readable PP-XXXXXXXX account assigned automatically.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-white block font-medium">Bcrypt Encrypted 4-Digit MPIN</strong>
                Hardware-level transaction authentication guarding all outgoing transfers.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-white block font-medium">Strict Double-Entry Bookkeeping</strong>
                No balances stored as volatile floats. Zero decimal leakage.
              </p>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protected with Laravel Sanctum tokens & signed email gates</span>
        </div>
      </div>

      {/* Right Column: Clean Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              PP
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">PayPen</span>
          </div>

          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Open your PayPen Wallet</CardTitle>
              <CardDescription>
                Sign up for instant PKR peer-to-peer transfers and bill payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  id="name"
                  placeholder="e.g. Danyal Khan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.name}
                />

                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email}
                />

                <div>
                  <Input
                    label="Password"
                    id="password"
                    type="password"
                    placeholder="Min 8 chars with letters & numbers"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.password}
                  />

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full">
                        <div
                          className={`h-full flex-1 rounded-full transition-colors ${
                            pwdScore >= 1 ? 'bg-rose-500' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-colors ${
                            pwdScore >= 2 ? 'bg-amber-500' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-colors ${
                            pwdScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-colors ${
                            pwdScore >= 4 ? 'bg-emerald-600' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 text-right">
                        {pwdScore <= 1 && 'Weak password'}
                        {pwdScore === 2 && 'Fair password'}
                        {pwdScore === 3 && 'Good password'}
                        {pwdScore >= 4 && 'Strong password'}
                      </p>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  id="password_confirmation"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    setFormData({ ...formData, password_confirmation: e.target.value })
                  }
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password_confirmation}
                />

                <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
                  Create Free Account
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                Already have a PayPen account?{' '}
                <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
                  Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </GuestGuard>
);
}

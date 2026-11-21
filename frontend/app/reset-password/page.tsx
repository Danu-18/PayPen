'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useResetPasswordMutation } from '@/src/redux/api/authApi';
import { GuestGuard } from '@/src/components/auth/GuestGuard';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { toast } from 'sonner';
import { Lock, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';

const resetSchema = z
  .object({
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetApi, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token || !email) {
      toast.error('Invalid or missing password reset link parameters.');
      return;
    }

    const validation = resetSchema.safeParse(formData);
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
      await resetApi({
        email,
        token,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      }).unwrap();

      toast.success('Your password has been successfully reset! Please sign in.');
      window.location.href = '/login';
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      toast.error(apiErr.data?.message || 'Failed to reset password. Link may have expired.');
    }
  };

  return (
    <Card className="border-slate-200/80 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Set New Password</CardTitle>
        <CardDescription>
          Choose a secure password of at least 8 characters containing both letters and numbers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            value={formData.password_confirmation}
            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            error={errors.password_confirmation}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
            Update Password
          </Button>

          <div className="pt-2 text-center text-xs text-slate-500">
            Remember your credentials?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">PayPen</span>
            </Link>
            <p className="text-sm text-slate-500">Security & Authentication</p>
          </div>

          <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </GuestGuard>
  );
}

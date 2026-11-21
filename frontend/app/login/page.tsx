'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useLoginMutation } from '@/src/redux/api/authApi';
import { useAppDispatch } from '@/src/redux/hooks';
import { setCredentials } from '@/src/redux/slices/authSlice';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { toast } from 'sonner';
import { Lock, Mail, CreditCard, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginApi, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse(formData);
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
      const res = await loginApi(formData).unwrap();
      dispatch(
        setCredentials({
          user: res.user,
          token: res.token,
          wallet: res.wallet,
        })
      );
      toast.success('Welcome back to PayPen!');

      if (res.user.is_email_verified || res.user.email_verified_at) {
        router.push('/dashboard');
      } else {
        router.push('/verify-email');
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      if (apiErr.data?.errors) {
        const backendErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.data.errors)) {
          backendErrors[key] = msgs[0];
        }
        setErrors(backendErrors);
      } else {
        toast.error(apiErr.data?.message || 'Login failed. Please check your credentials.');
      }
    }
  };

  return (
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
          <p className="text-sm text-slate-500">Sign in to your digital wallet</p>
        </div>

        <Card className="border-slate-200/80 shadow-md">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your wallet and ledger
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Input
                label="Password"
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password}
              />

              <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
                Open a free wallet
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Encrypted with 256-bit SSL & Laravel Sanctum authentication</span>
        </div>
      </div>
    </div>
  );
}

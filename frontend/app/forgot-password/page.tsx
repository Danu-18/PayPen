'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForgotPasswordMutation } from '@/src/redux/api/authApi';
import { GuestGuard } from '@/src/components/auth/GuestGuard';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { toast } from 'sonner';
import { Mail, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [forgotApi, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = forgotSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid email');
      return;
    }

    try {
      await forgotApi({ email }).unwrap();
      setSubmitted(true);
      toast.success('Password reset instructions dispatched.');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const errorMessage =
        apiErr.data?.errors?.email?.[0] ||
        apiErr.data?.message ||
        'No registered PayPen account found with this email address.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

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
            <p className="text-sm text-slate-500">Account Recovery & Security</p>
          </div>

          <Card className="border-slate-200/80 shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your registered email address and we will send you a secure 15-minute reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Check Your Inbox</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      If an account exists for <strong className="text-slate-800">{email}</strong>, we have dispatched a password reset link valid for 15 minutes.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/login" className="block w-full">
                      <Button variant="outline" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                        Return to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Registered Email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    required
                  />

                  <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
                    Send Reset Link
                  </Button>

                  <div className="pt-2 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </GuestGuard>
  );
}

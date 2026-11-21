'use client';

import React from 'react';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { HandCoins } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';

export default function RequestsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Money Requests</h1>
            <p className="text-sm text-slate-500">Request money from peer wallets</p>
          </div>
          <EmptyState
            icon={<HandCoins className="w-6 h-6 text-emerald-600" />}
            title="Money Requests Coming in Sprint 3"
            description="The money_requests database table and relationships are configured. Request creation, accept/reject flows, and expiry logic will be active in Sprint 3."
            action={
              <Link href="/dashboard">
                <Button variant="primary" size="sm">Back to Dashboard</Button>
              </Link>
            }
          />
        </div>
      </AppShell>
    </AuthGuard>
  );
}

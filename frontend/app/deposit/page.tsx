'use client';

import React from 'react';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ArrowDownToLine } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';

export default function DepositPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add Money (Deposit)</h1>
            <p className="text-sm text-slate-500">Wallet balance top-up scheduled for Sprint 2</p>
          </div>
          <EmptyState
            icon={<ArrowDownToLine className="w-6 h-6 text-emerald-600" />}
            title="Deposit System Coming in Sprint 2"
            description="The underlying database models, system clearing wallet, and double-entry ledger are fully configured. Deposit simulation will be implemented in Sprint 2."
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

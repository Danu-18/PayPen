'use client';

import React from 'react';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Receipt } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';

export default function BillsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Utility Bill Payments</h1>
            <p className="text-sm text-slate-500">Pay electricity, gas, internet and mobile bills</p>
          </div>
          <EmptyState
            icon={<Receipt className="w-6 h-6 text-emerald-600" />}
            title="Utility Bills Coming in Sprint 2"
            description="The 4 biller wallets (K-Electric, SSGC, PTCL, Jazz) and 8 realistic bills are seeded in the database. Bill inquiry and payment workflows will be activated in Sprint 2."
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

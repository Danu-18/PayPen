'use client';

import React from 'react';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';

export default function AdminPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Control Portal</h1>
            <p className="text-sm text-slate-500">System revenue, fee configuration, and fraud controls</p>
          </div>
          <EmptyState
            icon={<ShieldCheck className="w-6 h-6 text-rose-600" />}
            title="Admin Portal Coming in Sprint 3"
            description="System wallets (PP-SYS-CLEARING, PP-SYS-REVENUE) and system settings are seeded in the database. Admin monitoring, fee controls, and fraud inspection dashboards will be enabled in Sprint 3."
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

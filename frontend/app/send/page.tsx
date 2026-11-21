'use client';

import React from 'react';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';

export default function SendPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Send Money (P2P Transfer)</h1>
            <p className="text-sm text-slate-500">Peer-to-peer wallet transfers scheduled for Sprint 2</p>
          </div>
          <EmptyState
            icon={<Send className="w-6 h-6 text-emerald-600" />}
            title="P2P Transfers Coming in Sprint 2"
            description="The underlying database models, ledger entries, and wallet balances are ready. Transfer endpoints and idempotency validation will be wired in Sprint 2."
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

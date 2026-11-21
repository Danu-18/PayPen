'use client';

import React from 'react';
import { AuthGuard } from '@/src/components/auth/AuthGuard';
import { AppShell } from '@/src/components/layout/AppShell';
import { TransactionTable } from '@/src/components/transactions/TransactionTable';
import { History, ShieldCheck } from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Transaction & Ledger History
                </h1>
                <Badge variant="info">Immutable</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Complete institutional audit trail of your deposits, transfers, and ledger entries
              </p>
            </div>
          </div>

          <TransactionTable />
        </div>
      </AppShell>
    </AuthGuard>
  );
}

'use client';

import React, { useState } from 'react';
import { useGetTransactionsQuery } from '@/src/redux/api/transactionApi';
import { useAppSelector } from '@/src/redux/hooks';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { toast } from 'sonner';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export interface TransactionTableProps {
  initialLimit?: number;
  hideFilters?: boolean;
  hideRefreshButton?: boolean;
}

export function TransactionTable({
  initialLimit = 10,
  hideFilters = false,
  hideRefreshButton = false,
}: TransactionTableProps) {
  const { token } = useAppSelector((state) => state.auth);

  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery(
    {
      page,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      type: typeFilter,
      status: statusFilter,
    },
    { skip: !token }
  );

  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set('start_date', startDate);
      if (endDate) queryParams.set('end_date', endDate);
      if (typeFilter !== 'all') queryParams.set('type', typeFilter);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${apiUrl}/transactions/export?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/csv',
        },
      });

      if (!res.ok) throw new Error('Failed to download CSV');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paypen_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Transaction history exported as CSV');
    } catch {
      toast.error('Failed to export CSV file');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(startDate || endDate || typeFilter !== 'all' || statusFilter !== 'all');

  return (
    <div className="space-y-4">
      {/* Filters & Export Bar */}
      {!hideFilters && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Start Date */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-slate-800 focus:outline-none text-xs"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-slate-800 focus:outline-none text-xs"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="p2p_transfer">P2P Transfers</option>
              <option value="bill_payment">Bill Payments</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            {!hideRefreshButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                isLoading={isFetching}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              isLoading={isExporting}
              leftIcon={<Download className="w-3.5 h-3.5 text-slate-600" />}
            >
              Export CSV
            </Button>
          </div>
        </div>
      )}

      {/* Transactions Table Container */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Transaction / Counterparty</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Platform Fee</th>
              <th className="py-3 px-4 text-right">Balance After</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-4"><Skeleton className="w-36 h-4" /></td>
                  <td className="py-3.5 px-4"><Skeleton className="w-24 h-4" /></td>
                  <td className="py-3.5 px-4 text-right"><Skeleton className="w-20 h-4 ml-auto" /></td>
                  <td className="py-3.5 px-4 text-right"><Skeleton className="w-16 h-4 ml-auto" /></td>
                  <td className="py-3.5 px-4 text-right"><Skeleton className="w-20 h-4 ml-auto" /></td>
                  <td className="py-3.5 px-4 text-center"><Skeleton className="w-16 h-5 mx-auto rounded-full" /></td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <EmptyState
                    icon={<Receipt className="w-6 h-6 text-slate-400" />}
                    title="No Transactions Found"
                    description={
                      hasActiveFilters
                        ? 'No ledger records match the selected date or category filter.'
                        : 'Your double-entry ledger is clean. Deposit funds or send money to see records in real-time.'
                    }
                  />
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isPositive = tx.direction === 'deposit' || tx.direction === 'received';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Counterparty & Direction */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{tx.counterparty}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {tx.description || tx.reference_id.slice(0, 18) + '...'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(tx.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span className={isPositive ? 'text-emerald-600' : 'text-slate-900'}>
                        {isPositive ? '+' : '-'} PKR {tx.formatted_amount}
                      </span>
                    </td>

                    {/* Fee */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                      {tx.fee > 0 ? `PKR ${tx.formatted_fee}` : '—'}
                    </td>

                    {/* Balance After */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                      {tx.formatted_balance_after ? `PKR ${tx.formatted_balance_after}` : '—'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          tx.status === 'completed'
                            ? 'success'
                            : tx.status === 'pending'
                            ? 'warning'
                            : tx.status === 'reversed'
                            ? 'neutral'
                            : 'danger'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2 text-xs text-slate-500">
          <p>
            Showing{' '}
            <strong className="text-slate-800">
              {(pagination.current_page - 1) * pagination.per_page + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800">
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
            </strong>{' '}
            of <strong className="text-slate-800">{pagination.total}</strong> transactions
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current_page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>

            <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold text-xs">
              {pagination.current_page} / {pagination.last_page}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setPage((prev) => Math.min(pagination.last_page, prev + 1))}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

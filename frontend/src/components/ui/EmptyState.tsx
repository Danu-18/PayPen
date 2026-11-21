import React from 'react';
import { cn } from '@/src/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center text-slate-500 shadow-sm mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mt-1.5">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

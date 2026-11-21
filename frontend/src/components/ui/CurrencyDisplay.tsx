import React from 'react';
import { cn } from '@/src/lib/utils';

export interface CurrencyDisplayProps {
  amountMinor: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showCurrency?: boolean;
}

export function CurrencyDisplay({
  amountMinor,
  currency = 'PKR',
  size = 'md',
  className,
  showCurrency = true,
}: CurrencyDisplayProps) {
  const majorValue = (amountMinor / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sizes = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
    hero: 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight',
  };

  return (
    <span className={cn('tabular-nums font-mono inline-flex items-baseline gap-1', sizes[size], className)}>
      {showCurrency && (
        <span className="text-xs sm:text-sm font-semibold opacity-75 font-sans">
          {currency}
        </span>
      )}
      <span>{majorValue}</span>
    </span>
  );
}

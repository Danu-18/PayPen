import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format minor units into human-readable currency.
 * e.g., 15000 -> "PKR 150.00"
 */
export function formatMinorUnits(amountMinor: number, currency: string = 'PKR'): string {
  const major = (amountMinor / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${major}`;
}

'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary:
        'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 focus-visible:ring-emerald-500 shadow-sm shadow-emerald-600/20 rounded-xl',
      secondary:
        'bg-slate-900 text-white hover:bg-slate-800 active:bg-black focus-visible:ring-slate-900 shadow-sm rounded-xl',
      outline:
        'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-emerald-500 rounded-xl',
      ghost:
        'text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400 rounded-xl',
      danger:
        'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus-visible:ring-rose-500 shadow-sm shadow-rose-600/20 rounded-xl',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
      md: 'text-sm px-4 py-2.5 gap-2 min-h-[42px]',
      lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[50px] font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

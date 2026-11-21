'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { logout } from '@/src/redux/slices/authSlice';
import { baseApi } from '@/src/redux/api/baseApi';
import { useLogoutMutation } from '@/src/redux/api/authApi';
import {
  LayoutDashboard,
  Send,
  ArrowDownToLine,
  Receipt,
  HandCoins,
  User,
  History,
  ShieldCheck,
  LogOut,
  Wallet as WalletIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // ignore network errors on logout
    } finally {
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      toast.success('Logged out successfully');
      window.location.href = '/login';
    }
  };

  const userNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Send Money', href: '/send', icon: Send },
    { label: 'Add Money', href: '/deposit', icon: ArrowDownToLine },
    { label: 'Transactions', href: '/transactions', icon: History },
    { label: 'Pay Bills', href: '/bills', icon: Receipt },
    { label: 'Requests', href: '/requests', icon: HandCoins },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Admin Portal', href: '/admin', icon: ShieldCheck },
    { label: 'System Transactions', href: '/transactions', icon: History },
    { label: 'Admin Profile', href: '/profile', icon: User },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  const mobileNavItems = user?.role === 'admin'
    ? [
        { label: 'Portal', href: '/admin', icon: ShieldCheck },
        { label: 'Transactions', href: '/transactions', icon: History },
        { label: 'Profile', href: '/profile', icon: User },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Send', href: '/send', icon: Send },
        { label: 'Bills', href: '/bills', icon: Receipt },
        { label: 'Requests', href: '/requests', icon: HandCoins },
        { label: 'Profile', href: '/profile', icon: User },
      ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 z-30 shadow-xs">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md',
              user?.role === 'admin'
                ? 'bg-gradient-to-tr from-rose-600 to-indigo-600 shadow-rose-500/20'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
            )}
          >
            {user?.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <WalletIcon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">PayPen</span>
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm',
                  user?.role === 'admin'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800'
                )}
              >
                {user?.role === 'admin' ? 'Admin' : 'Fintech'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {user?.role === 'admin' ? 'System Administration' : 'Digital Wallet & Ledger'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? user?.role === 'admin'
                      ? 'bg-rose-50 text-rose-700 font-semibold shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? user?.role === 'admin'
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border',
                  user?.role === 'admin'
                    ? 'bg-rose-600/10 text-rose-700 border-rose-600/20'
                    : 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20'
                )}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PP'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.role === 'admin' ? 'System Administrator' : user?.email}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Sticky Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs',
              user?.role === 'admin' ? 'bg-rose-600' : 'bg-emerald-600'
            )}
          >
            {user?.role === 'admin' ? 'AD' : 'PP'}
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">PayPen</span>
          {user?.role === 'admin' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-800">
              Admin
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border',
              user?.role === 'admin'
                ? 'bg-rose-600/10 text-rose-700 border-rose-600/20'
                : 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20'
            )}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PP'}
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-8">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (375px friendly, zero overflow) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom shadow-lg">
        <div className={cn('grid h-16', user?.role === 'admin' ? 'grid-cols-3' : 'grid-cols-5')}>
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors select-none',
                  isActive
                    ? user?.role === 'admin'
                      ? 'text-rose-600 font-semibold'
                      : 'text-emerald-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 mb-0.5',
                    isActive && (user?.role === 'admin' ? 'text-rose-600' : 'text-emerald-600')
                  )}
                />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

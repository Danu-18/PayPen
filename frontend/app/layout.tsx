import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/src/redux/StoreProvider';

export const metadata: Metadata = {
  title: 'PayPen | Modern Digital Wallet & Ledger',
  description: 'Ultra-secure, double-entry digital wallet and financial ledger platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

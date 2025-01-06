// app/ClientLayout.tsx

'use client';

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import AppLayout from '@/components/app/AppLayout';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname.startsWith('/auth/');

  return (
    <SessionProvider>
      {!isLandingPage && !isAuthPage ? (
        <AppLayout>
          {children}
        </AppLayout>
      ) : (
        children
      )}
    </SessionProvider>
  );
}
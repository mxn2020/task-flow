// app/ClientLayout.tsx

'use client';

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import AppLayout from '@/components/app/AppLayout';

type ClientLayoutProps = {
  children: React.ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = pathname === '/' || pathname.startsWith('/auth/');

  return (
    <SessionProvider>
      {isPublicRoute ? children : <AppLayout>{children}</AppLayout>}
    </SessionProvider>
  );
}

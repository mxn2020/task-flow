// app/dashboard/layout.tsx

'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { NotificationCenter } from '@/components/app/NotificationCenter';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Notification Center */}
      {/*
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <NotificationCenter />
      </div>
      */}
      {/* Main Content */}
      <main className="pt-6 px-4 pb-20 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SystemScopesNav } from '@/components/task/SystemScopesNav';
import { FolderKanban, Settings } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background">
      <div className="flex justify-around items-center">
        <SystemScopesNav isMobile />
        
        <Link
          href="/organization"
          className={`flex flex-col items-center p-2 ${pathname === '/organization' ? 'text-primary' : ''}`}
        >
          <FolderKanban className="h-6 w-6" />
          <span className="text-xs mt-1">Organization</span>
        </Link>

        <Link
          href="/settings"
          className={`flex flex-col items-center p-2 ${pathname === '/settings' ? 'text-primary' : ''}`}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
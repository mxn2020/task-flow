// components/app/MobileNav.tsx

import React, { JSX } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Settings, AlertOctagon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SystemScopesNav } from '../task/SystemScopesNav';

interface NavLink {
  href: string;
  icon: JSX.Element;
  label: string;
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const navLinks: NavLink[] = [
    {
      href: '/organization',
      icon: <FolderKanban className="h-6 w-6" />,
      label: 'Organization'
    },
    {
      href: '/settings',
      icon: <Settings className="h-6 w-6" />,
      label: 'Settings'
    }
  ];

  const handleNavigation = (href: string) => (e: React.MouseEvent) => {
    try {
      if (pathname === href) {
        e.preventDefault();
        return;
      }
      // Additional navigation logic if needed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Navigation failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertOctagon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-around items-center">
        <SystemScopesNav isMobile />

        {navLinks.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={handleNavigation(href)}
            className={`flex flex-col items-center p-2 transition-colors
              ${pathname === href ? 'text-primary' : 'text-muted-foreground hover:text-primary'}
            `}
          >
            {icon}
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}


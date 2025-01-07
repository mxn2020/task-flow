// components/app/SystemScopesNav.tsx

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import * as Icons from 'lucide-react';
import { toCamelCase } from '@/lib/utils';
import { useMenu } from '@/contexts/MenuContext';

interface SystemScope {
  name: string;
  showInSidebar: boolean;
  position: number;
}

const SCOPE_CONFIG = {
  todo: { label: 'Todos', icon: 'CheckCircle' },
  brainstorm: { label: 'Brainstorms', icon: 'Lightbulb' },
  note: { label: 'Notes', icon: 'StickyNote' },
  checklist: { label: 'Checklists', icon: 'ListChecks' },
  milestone: { label: 'Milestones', icon: 'Target' },
  resource: { label: 'Resources', icon: 'BookOpen' },
  timeblock: { label: 'Timeblocks', icon: 'Clock' },
  event: { label: 'Events', icon: 'Calendar' },
  bookmark: { label: 'Bookmarks', icon: 'Bookmark' },
  flow: { label: 'Flows', icon: 'GitBranch' }
} as const;

export function SystemScopesNav({
  isMobile = false,
  onClose
}: {
  isMobile?: boolean,
  onClose?: () => void
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [systemScopes, setSystemScopes] = useState<SystemScope[]>([]);
  const { registerRefreshHandler } = useMenu();

  const fetchSystemScopes = async () => {
    if (!session?.user?.id) return;

    // Get visibility settings from scopes table
    const { data: scopeData } = await supabase
      .from('scopes')
      .select('name, show_in_sidebar')
      .eq('is_system', true);

    // Get position settings from user_settings table
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', session.user.id)
      .eq('key', 'system_scope_positions')
      .single();

    if (scopeData) {
      const positions = settingsData?.value || {};
      const scopes = Object.keys(SCOPE_CONFIG).map(scopeName => ({
        name: scopeName,
        showInSidebar: scopeData.find(s => s.name === scopeName)?.show_in_sidebar ?? true,
        position: positions[scopeName] ?? Object.keys(SCOPE_CONFIG).indexOf(scopeName)
      }));
      setSystemScopes(scopes.sort((a, b) => a.position - b.position));
    }
  };

  useEffect(() => {
    const cleanup = registerRefreshHandler(fetchSystemScopes);
    fetchSystemScopes();
    return cleanup;
  }, [session?.user?.id, registerRefreshHandler]);

  const visibleScopes = systemScopes
    .filter(scope => scope.showInSidebar)
    .sort((a, b) => a.position - b.position);

  const displayScopes = isMobile ? visibleScopes.slice(0, 2) : visibleScopes;

  if (isMobile) {
    return (
      <>
        {displayScopes.map(scope => {
          const config = SCOPE_CONFIG[scope.name as keyof typeof SCOPE_CONFIG];
          const Icon = Icons[config.icon];
          const isActive = pathname === `/${scope.name}s`;

          return (
            <Link
              key={scope.name}
              href={`/${scope.name}s`}
              className={`flex flex-col items-center p-2 ${isActive ? 'text-primary' : ''}`}
              onClick={onClose}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{config.label}</span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {displayScopes.map(scope => {
        const config = SCOPE_CONFIG[scope.name as keyof typeof SCOPE_CONFIG];
        const Icon = Icons[config.icon];
        const isActive = pathname === `/${scope.name}s`;

        return (
          <Link
            key={scope.name}
            href={`/${scope.name}s`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive
              ? 'bg-secondary/50 text-primary'
              : 'hover:bg-secondary/30'
              }`}
            onClick={onClose ? onClose : undefined}
          >
            <Icon className="h-5 w-5" />
            {config.label}
          </Link>
        );
      })}
    </>
  );
}
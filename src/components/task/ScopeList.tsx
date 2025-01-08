// components/task/ScopeList.tsx

'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  MoreHorizontal, Eye, EyeOff, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Scope } from '@/types';

// Utility Components
const DynamicIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon {...props} /> : null;
};


export const ScopeList = ({
  userScopes,
  onEdit,
  onVisibilityToggle,
  pathname
}: {
  userScopes: Scope[];
  onEdit: (scope: Scope) => void;
  onVisibilityToggle: (id: string) => void;
  pathname: string;
}) => (
  <div className="space-y-1">
    {userScopes.map((scope) => (
      <motion.div
        key={scope.id}
        className="group relative"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          href={`/scopes/${scope.slug}`}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === `/scopes/${scope.slug}`
            ? 'bg-secondary/50 text-primary'
            : 'hover:bg-secondary/30'
            }`}
        >
          <DynamicIcon name={scope.icon || ''} className="h-5 w-5" />
          {scope.name}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(scope)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onVisibilityToggle(scope.id)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide from sidebar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    ))}
  </div>
);
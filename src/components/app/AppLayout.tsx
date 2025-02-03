// components/app/AppLayout.tsx

'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  Home, List, Brain, FolderKanban, Settings,
  Sun, Moon, Menu, X, Amphora, Notebook, Plus,
  MoreHorizontal, Eye, EyeOff, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '@/lib/utils';
import { useMenu } from '@/contexts/MenuContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MobileNav } from './MobileNav';
import { NotificationCenter } from './NotificationCenter';

const DesktopLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  if (status === "loading") return null;
  if (!session) {
    window.location.href = "/auth/signin";
    return null;
  }

  return (
    <motion.div
      className="hidden md:flex min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.aside
        className="fixed w-64 h-screen border-r border-border bg-background"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <motion.h1
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              NextStack Pro
            </motion.h1>
          </div>

          <nav className="flex-1 px-4">

            <Separator className="my-4" />

          </nav>
        </div>
      </motion.aside>

      <div className="flex-1 ml-64">
        <Header theme={theme} setTheme={setTheme} session={session} />
        <main className="p-6">
          <motion.div
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

    </motion.div>
  );
};

const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex flex-col h-[100dvh] overflow-hidden">
      <motion.header
        className="h-16 border-b border-border bg-background px-4 flex items-center justify-between z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <MobileMenu onClose={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold">NextStack Pro</h1>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Theme Toggle */}
        {/*
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        */}

      </motion.header>

      <main className="flex-1 px-4 overflow-y-auto">
        <motion.div
          className="max-w-3xl mx-auto py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {children}
        </motion.div>
      </main>

      <motion.nav
        className="h-16 bg-background border-t border-border"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div className="flex justify-around h-full items-center">
          <MobileNav />
        </div>
      </motion.nav>
    </div>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      <div key="layout">
        <div className="md:block hidden">
          <DesktopLayout>{children}</DesktopLayout>
        </div>
        <div className="md:hidden block">
          <MobileLayout>{children}</MobileLayout>
        </div>
      </div>
    </AnimatePresence>
  );
}



// Utility Components
const DynamicIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon {...props} /> : null;
};

const Header = ({ theme, setTheme, session }: any) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userInitials = session.user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || '?';

  if (!mounted) return null;

  return (
    <motion.header
      className="h-16 border-b border-border bg-background px-6 flex items-center justify-between"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
    >
      <div className="flex-1" />
      <div className="flex items-center gap-4">

        {/* Notification Toggle */}
        <div className="hidden md:block">
          <NotificationCenter />
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <UserMenu userInitials={userInitials} />
      </div>
    </motion.header>
  );
};

const UserMenu = ({ userInitials }: { userInitials: string }) => {
  const { data: session } = useSession();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar>
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        {session?.user?.role === 'superadmin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin Dashboard</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
 };
 
const MobileMenu = ({ onClose }: { onClose: () => void }) => {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <SheetTitle>Menu</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </SheetHeader>
      <nav className="flex-1 p-4">

        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${pathname === '/dashboard' ? 'bg-secondary/50 text-primary' : 'hover:bg-secondary/30'
            }`}
          onClick={onClose}
        >
          <Home className="h-5 w-5" />
          Dashboard
        </Link>

      </nav>
    </div>
  );
};
// components/app/AppLayout.tsx

'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, CheckCircle, List, LogOut, Sun, Moon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import DeviceInfo from '@/components/app/DeviceInfo';
import NavigatorInfo from '@/components/app/NavInfo';
import { useState, useEffect } from 'react';

const animations = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }
};

export default function LandingPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden md:block fixed w-full backdrop-blur-md z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">TaskFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="mr-2"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : session ? (
                <>
                  <Button asChild>
                    <Link href="/dashboard">Launch App</Link>
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50"
      >
        <div className="flex justify-around py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="absolute left-4 bottom-4"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : session ? (
            <>
              <Button asChild className="flex-1 mx-2">
                <Link href="/dashboard">Launch App</Link>
              </Button>
              <Button variant="ghost" onClick={handleSignOut} className="flex-1 mx-2">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="flex-1 mx-2">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild className="flex-1 mx-2">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.div
        variants={animations.container}
        initial="hidden"
        animate="show"
        className="relative pt-16 md:pt-24 pb-32 overflow-hidden"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={animations.item} className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Organize your thoughts and tasks in one place
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12">
              A powerful todo list and brainstorming tool designed to boost your productivity
            </p>
            <Button size="lg" asChild>
              <Link href={session ? "/dashboard" : "/auth/signup"}>
                Get Started
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="py-16 bg-secondary/30" role="region" aria-label="Features">
        <motion.div
          variants={animations.container}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <List className="h-12 w-12 mb-4 text-primary" />,
                title: "Smart Todo Lists",
                description: "Create nested tasks and organize them into groups"
              },
              {
                icon: <Brain className="h-12 w-12 mb-4 text-accent" />,
                title: "Brainstorming",
                description: "Capture and organize your ideas with our powerful brainstorming tool"
              },
              {
                icon: <CheckCircle className="h-12 w-12 mb-4 text-green-500" />,
                title: "Stay Productive",
                description: "Track progress and stay focused on what matters most"
              }
            ].map((feature, index) => (
              <motion.div key={feature.title} variants={animations.item}>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    {feature.icon}
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Testing Section */}
      <div className="py-16 bg-background" role="region" aria-label="Device Testing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold mb-8 text-center">Device Testing</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <DeviceInfo />
            <NavigatorInfo />
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  );
}
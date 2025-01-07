// app/page.tsx

'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, CheckCircle, List, LogOut, Sun, Moon, Loader2, Database, Shield, Zap, Code, Layout, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import DeviceInfo from '@/components/app/DeviceInfo';
import NavigatorInfo from '@/components/app/NavInfo';
import { useState, useEffect } from 'react';
import { AppError } from '@/lib/errors/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      const error = err as Error;
      setError(new AppError(error.message, 500, 'AUTH_ERROR'));
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isLoading = status === 'loading';

  const features = [
    {
      icon: <Code className="h-12 w-12 mb-4 text-primary" />,
      title: "Modern Stack",
      description: "Next.js 14, TypeScript, and Tailwind CSS for robust development"
    },
    {
      icon: <Shield className="h-12 w-12 mb-4 text-accent" />,
      title: "Authentication",
      description: "Secure auth system with NextAuth.js and Supabase integration"
    },
    {
      icon: <Database className="h-12 w-12 mb-4 text-green-500" />,
      title: "Database Ready",
      description: "Supabase setup with migrations and type safety"
    }
  ];

  const technicalFeatures = [
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Performance Optimized",
      description: "Built-in Redis caching and job queue system"
    },
    {
      icon: <Layout className="h-8 w-8 text-blue-500" />,
      title: "PWA Support",
      description: "Offline-first architecture with service workers"
    },
    {
      icon: <Cpu className="h-8 w-8 text-purple-500" />,
      title: "Type Safety",
      description: "End-to-end type safety with TypeScript"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden md:block fixed w-full backdrop-blur-md z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">NextStack Pro</span>
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
              Ship Faster with <span className="text-primary">NextStack Pro</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12">
              Production-ready Next.js template with enterprise features built-in
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href={session ? "/dashboard" : "/auth/signup"}>
                  Get Started
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://github.com/yourusername/nextstack-pro">
                  View on GitHub
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Core Features */}
      <div className="py-16 bg-secondary/30">
        <motion.div
          variants={animations.container}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
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

      {/* Technical Features */}
      <div className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Technical Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {technicalFeatures.map((feature, index) => (
              <div key={feature.title} className="flex items-start space-x-4">
                <div className="mt-1">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Getting Started</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="p-6">
              <pre className="bg-secondary/50 p-4 rounded-lg overflow-x-auto">
                <code>
                  npx create-next-app@latest my-app --use-template nextstack-pro
                </code>
              </pre>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>1. Clone the template</p>
                <p>2. Configure environment variables</p>
                <p>3. Run migrations</p>
                <p>4. Start developing</p>
              </div>
            </Card>
          </div>
        </div>
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
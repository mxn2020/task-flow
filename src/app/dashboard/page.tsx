// app/dashboard/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckCircle2, Brain, FolderKanban, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AppError } from '@/lib/errors/types';

interface Stats {
  totalTodos: number;
  completedTodos: number;
  totalBrainstorms: number;
  totalGroups: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [stats, setStats] = useState<Stats>({
    totalTodos: 0,
    completedTodos: 0,
    totalBrainstorms: 0,
    totalGroups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const [todosResponse, brainstormsResponse, groupsResponse] = await Promise.all([
        supabase.from('todos').select('*', { count: 'exact' }).eq('user_id', userId),
        supabase.from('brainstorms').select('*', { count: 'exact' }).eq('user_id', userId),
        supabase.from('groups').select('*', { count: 'exact' }).eq('user_id', userId),
      ]);

      if (todosResponse.error) throw new AppError('Failed to fetch todos', 500, 'FETCH_ERROR');
      if (brainstormsResponse.error) throw new AppError('Failed to fetch brainstorms', 500, 'FETCH_ERROR');
      if (groupsResponse.error) throw new AppError('Failed to fetch groups', 500, 'FETCH_ERROR');

      const completedTodos = todosResponse.data?.filter(todo => todo.completed).length || 0;

      setStats({
        totalTodos: todosResponse.count || 0,
        completedTodos,
        totalBrainstorms: brainstormsResponse.count || 0,
        totalGroups: groupsResponse.count || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof AppError ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <CardContent className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => { setError(''); fetchStats(); }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 mt-10" role="main" aria-label="Dashboard">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Todos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTodos}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTodos} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Brainstorms</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBrainstorms}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Groups</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGroups}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button asChild>
                <Link href="/todos">
                  <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  New Todo
                </Link>
              </Button>
              <Button asChild>
                <Link href="/brainstorms">
                  <Brain className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">New Brainstorm Note</span>
                  <span className="sm:hidden">New Idea</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
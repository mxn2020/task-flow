// app/api/keys/usage/route.ts

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors/types';
import { APIKeyUsageStats } from '@/types/api-keys';

export const GET = withAuth(async (
  req: Request,
  context: any,
  session: any
): Promise<NextResponse<APIKeyUsageStats | { error: string }>> => {
  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get('keyId');
  const days = parseInt(searchParams.get('days') || '7');

  if (!keyId) {
    throw new AppError('API key ID required', 400, 'VALIDATION_ERROR');
  }

  const { data: key } = await supabase
    .from('api_keys')
    .select('id')
    .eq('id', keyId)
    .eq('user_id', session.user.id)
    .single();

  if (!key) {
    throw new AppError('API key not found', 404, 'NOT_FOUND');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: usage, error: usageError } = await supabase
    .from('api_key_usage')
    .select('*')
    .eq('api_key_id', keyId)
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: true });

  if (usageError) {
    throw new AppError('Failed to fetch usage data', 500, 'DATABASE_ERROR');
  }

  const stats: APIKeyUsageStats = {
    totalRequests: usage.length,
    successfulRequests: usage.filter(u => u.status_code < 400).length,
    failedRequests: usage.filter(u => u.status_code >= 400).length,
    endpoints: Object.entries(
      usage.reduce((acc, u) => {
        acc[u.endpoint] = (acc[u.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([endpoint, count]) => ({ endpoint, count: count as number })),
    dailyUsage: Object.entries(
      usage.reduce((acc, u) => {
        const date = new Date(u.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([date, count]) => ({ date, count: count as number }))
  };

  return NextResponse.json(stats);
});

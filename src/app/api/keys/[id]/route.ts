// app/api/keys/[id]/route.ts

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabaseClient';
import { redis } from '@/lib/upstash';
import { AppError } from '@/lib/errors/types';

const RATE_LIMIT_PREFIX = 'rate_limit:';

interface RouteParams {
  params: { id: string };
}

export const DELETE = withAuth(async (
  req: Request, 
  { params }: RouteParams,
  session: any
) => {
  const { data: key } = await supabase
    .from('api_keys')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (!key) {
    throw new AppError('API key not found', 404, 'NOT_FOUND');
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) throw new AppError('Failed to revoke API key', 500, 'DATABASE_ERROR');

  await redis.del(`${RATE_LIMIT_PREFIX}${params.id}`);

  return NextResponse.json({ success: true });
});
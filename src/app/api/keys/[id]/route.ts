// app/api/keys/[id]/route.ts

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabaseClient';
import { redis } from '@/lib/upstash';
import { AppError } from '@/lib/errors/types';

const RATE_LIMIT_PREFIX = 'rate_limit:';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  req: Request,
  { params }: RouteParams
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError('Unauthorized', 401, 'AUTH_ERROR');
    }

    const { data: key } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (!key) {
      throw new AppError('API key not found', 404, 'NOT_FOUND');
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new AppError('Failed to revoke API key', 500, 'DATABASE_ERROR');

    await redis.del(`${RATE_LIMIT_PREFIX}${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: error instanceof AppError ? error.message : 'Failed to revoke API key' },
      { status: error instanceof AppError ? error.statusCode : 500 }
    );
  }
}

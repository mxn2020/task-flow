// app/api/keys/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { redis } from '@/lib/upstash';
import crypto from 'crypto';
import { z } from 'zod';
import { AppError } from '@/lib/errors/types';
import { APIKey, APIKeyDB, CreateAPIKeyRequest, CreateAPIKeyResponse } from '@/types/api-keys';

const KEY_PREFIX_LENGTH = 8;
const RATE_LIMIT_PREFIX = 'rate_limit:';

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = crypto.randomBytes(32).toString('base64');
  const prefix = key.slice(0, KEY_PREFIX_LENGTH);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().min(1).max(365).optional(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
  }),
  rateLimit: z.number().min(1).max(10000),
});

export async function GET(): Promise<NextResponse<APIKey[] | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError('Unauthorized', 401, 'AUTH_ERROR');
    }

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', session.user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false }) as { data: APIKeyDB[] | null, error: any };

    if (error) throw new AppError('Database error', 500, 'DATABASE_ERROR');

    if (!keys) {
        return NextResponse.json([] as APIKey[]);
    }

    const formattedKeys: APIKey[] = keys.map(key => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      permissions: key.permissions,
      rateLimit: key.rate_limit,
      expiresAt: key.expires_at,
      lastUsedAt: key.last_used_at,
      createdAt: key.created_at
    }));

    return NextResponse.json(formattedKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: error instanceof AppError ? error.message : 'Failed to fetch API keys' },
      { status: error instanceof AppError ? error.statusCode : 500 }
    );
  }
}

export async function POST(
  req: Request
): Promise<NextResponse<CreateAPIKeyResponse | { error: string }>> {
    try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError('Unauthorized', 401, 'AUTH_ERROR');
    }

    const body = await req.json();
    const validatedData = createKeySchema.parse(body);

    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .is('revoked_at', null);

    if (count && count >= 10) {
      throw new AppError('Maximum number of active API keys reached (10)', 400, 'LIMIT_ERROR');
    }

    const { key, prefix, hash } = generateApiKey();
    const expiresAt = validatedData.expiresInDays
      ? new Date(Date.now() + validatedData.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const { error } = await supabase.from('api_keys').insert({
      user_id: session.user.id,
      name: validatedData.name,
      key_hash: hash,
      prefix,
      permissions: validatedData.permissions,
      rate_limit: validatedData.rateLimit,
      expires_at: expiresAt,
    });

    if (error) throw new AppError('Failed to create API key', 500, 'DATABASE_ERROR');

    return NextResponse.json({ key });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: error instanceof AppError ? error.message : 'Failed to create API key' },
      { status: error instanceof AppError ? error.statusCode : 500 }
    );
  }
}

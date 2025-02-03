import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
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
  expiresInDays: z.number().min(1).max(365).optional().nullable(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
  }),
  rateLimit: z.number().min(1).max(10000),
});

export const GET = withAuth(async (req: Request, context: any, session: any) => {
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
    createdAt: key.created_at,
    revokedAt: key.revoked_at ?? null,
  }));

  return NextResponse.json(formattedKeys);
});

export const POST = withAuth(async (req: Request, context: any, session: any) => {
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
});
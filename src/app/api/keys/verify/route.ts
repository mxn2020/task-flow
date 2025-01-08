// app/api/keys/verify/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { redis } from '@/lib/upstash';
import crypto from 'crypto';
import { AppError } from '@/lib/errors/types';

const KEY_PREFIX_LENGTH = 8;
const RATE_LIMIT_PREFIX = 'rate_limit:';

export async function POST(req: Request) {
    try {
      const apiKey = req.headers.get('x-api-key');
      if (!apiKey) {
        throw new AppError('API key required', 401, 'AUTH_ERROR');
      }
  
      const prefix = apiKey.slice(0, KEY_PREFIX_LENGTH);
      const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
      const { data: key, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', hash)
        .eq('prefix', prefix)
        .is('revoked_at', null)
        .single();
  
      if (error || !key) {
        throw new AppError('Invalid API key', 401, 'AUTH_ERROR');
      }
  
      if (key.expires_at && new Date(key.expires_at) < new Date()) {
        throw new AppError('Expired API key', 401, 'AUTH_ERROR');
      }
  
      const rateLimitKey = `${RATE_LIMIT_PREFIX}${key.id}`;
      const currentUsage = await redis.incr(rateLimitKey);
      
      if (currentUsage === 1) {
        await redis.expire(rateLimitKey, 24 * 60 * 60);
      }
  
      if (currentUsage > key.rate_limit) {
        throw new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_ERROR');
      }
  
      await supabase.from('api_key_usage').insert({
        api_key_id: key.id,
        endpoint: new URL(req.url).pathname,
        method: req.method,
        status_code: 200
      });
  
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', key.id);
  
      return NextResponse.json({ permissions: key.permissions });
    } catch (error) {
      console.error('Error verifying API key:', error);
      
      return NextResponse.json(
        { error: error instanceof AppError ? error.message : 'Failed to verify API key' },
        { status: error instanceof AppError ? error.statusCode : 500 }
      );
    }
  }
  
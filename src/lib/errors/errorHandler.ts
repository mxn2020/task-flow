// src/lib/errors/errorHandler.ts
import { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { AppError } from './types';

export function handleError(error: unknown, res?: NextApiResponse) {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`);
    
    if (res) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      });
    }
  }
  
  // Handle unknown errors
  console.error('[UNKNOWN_ERROR]', error);
  if (res) {
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}
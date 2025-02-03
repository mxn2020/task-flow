// lib/api-middleware.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/types';

export async function withAuth(handler: Function) {
  return async (req: Request, context?: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new AppError('Unauthorized', 401, 'AUTH_ERROR');
      }

      if (session.user.is_suspended) {
        throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
      }

      return handler(req, context, session);
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: error instanceof AppError ? error.message : 'API Error' },
        { status: error instanceof AppError ? error.statusCode : 500 }
      );
    }
  };
}
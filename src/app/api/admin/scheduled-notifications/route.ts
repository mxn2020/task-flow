// app/api/admin/scheduled-notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabaseClient';
import { isSuperAdmin } from '@/lib/adminUtils';
import { AppError } from '@/lib/errors/types';

export const GET = withAuth(async (req: Request, context: any, session: any) => {
  if (!await isSuperAdmin(session.user.id)) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch notifications', 500, 'DATABASE_ERROR');

  return NextResponse.json(data);
});

export const POST = withAuth(async (req: NextRequest, context: any, session: any) => {
  if (!await isSuperAdmin(session.user.id)) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const notification = await req.json();
  const { error } = await supabase
    .from('scheduled_notifications')
    .insert({
      ...notification,
      created_by: session.user.id
    });

  if (error) throw new AppError('Failed to create notification', 500, 'DATABASE_ERROR');

  return NextResponse.json({ message: 'Notification created' });
});


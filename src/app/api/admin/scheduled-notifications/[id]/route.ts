// app/api/admin/scheduled-notifications/[id]/route.ts

import { withAuth } from "@/lib/api-middleware";
import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from '@/lib/adminUtils';
import { AppError } from '@/lib/errors/types';

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params;

  if (!await isSuperAdmin(session.user.id)) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const updates = await req.json();
  const { error } = await supabase
    .from('scheduled_notifications')
    .update(updates)
    .eq('id', id);

  if (error) throw new AppError('Failed to update notification', 500, 'DATABASE_ERROR');

  return NextResponse.json({ message: 'Notification updated' });
});

export const DELETE = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params;

  if (!await isSuperAdmin(session.user.id)) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const { error } = await supabase
    .from('scheduled_notifications')
    .delete()
    .eq('id', id);

  if (error) throw new AppError('Failed to delete notification', 500, 'DATABASE_ERROR');

  return NextResponse.json({ message: 'Notification deleted' });
});


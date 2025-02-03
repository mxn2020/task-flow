// app/api/notifications/history/route.ts

import { withAuth } from "@/lib/api-middleware";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { AppError } from '@/lib/errors/types';

export const GET = withAuth(async (req: Request, context: any, session: any) => {
  const { data, error } = await supabase
    .from('notification_history')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new AppError('Failed to fetch notifications', 500, 'DATABASE_ERROR');

  return NextResponse.json(data);
});


// app/api/notifications/queue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors/types';

const qstash = new Client({
  token: process.env.UPSTASH_QSTASH_TOKEN!
});

export const POST = withAuth(async (req: NextRequest, context: any, session: any) => {
  const { title, message, scheduledFor, userId } = await req.json();

  const { data, error } = await supabase
    .from('notification_queue')
    .insert({
      title,
      message,
      scheduled_for: scheduledFor,
      user_id: userId || session.user.id,
      created_by: session.user.id,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to queue notification', 500, 'DATABASE_ERROR');

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/process`,
    data: { notificationId: data.id },
    scheduled: new Date(scheduledFor).getTime()
  });

  return NextResponse.json({
    success: true,
    notification: data
  });
});


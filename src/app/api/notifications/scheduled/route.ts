// app/api/notifications/schedule/route.ts

import { NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { supabase } from '@/lib/supabaseClient';
import { queueNotification } from '@/lib/upstash';
import { withAuth } from '@/lib/api-middleware';
import { AppError } from '@/lib/errors/types';

const qstash = new Client({
  token: process.env.UPSTASH_QSTASH_TOKEN!
});

function getNextOccurrence(schedule: {
  schedule_type: 'daily' | 'weekly' | 'monthly';
  schedule_time: string;
  schedule_day?: number;
}) {
  const now = new Date();
  const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  if (schedule.schedule_type === 'weekly' && schedule.schedule_day) {
    while (next.getDay() !== schedule.schedule_day % 7) {
      next.setDate(next.getDate() + 1);
    }
  } else if (schedule.schedule_type === 'monthly' && schedule.schedule_day) {
    next.setDate(schedule.schedule_day);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

export const POST = withAuth(async (req: Request, context: any, session: any) => {
  const { data: scheduledNotifications, error: fetchError } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('is_active', true);

  if (fetchError) throw new AppError('Failed to fetch scheduled notifications', 500, 'DATABASE_ERROR');

  for (const notification of scheduledNotifications || []) {
    const nextOccurrence = getNextOccurrence(notification);

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, timezone');

    if (usersError) throw new AppError('Failed to fetch users', 500, 'DATABASE_ERROR');
    if (!users) continue;

    for (const user of users) {
      const userTime = new Date(nextOccurrence.toLocaleString('en-US', {
        timeZone: user.timezone || 'UTC'
      }));

      let message = notification.message;

      if (message.includes('{todoCount}')) {
        const { count: todoCount, error: todoError } = await supabase
          .from('todos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', false);

        if (todoError) throw new AppError('Failed to fetch todo count', 500, 'DATABASE_ERROR');
        message = message.replace('{todoCount}', todoCount?.toString() || '0');
      }

      if (message.includes('{brainstormCount}')) {
        const { count: brainstormCount, error: brainstormError } = await supabase
          .from('brainstorm')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (brainstormError) throw new AppError('Failed to fetch brainstorm count', 500, 'DATABASE_ERROR');
        message = message.replace('{brainstormCount}', brainstormCount?.toString() || '0');
      }

      await queueNotification({
        userId: user.id,
        title: notification.title,
        message,
        scheduledFor: userTime,
        notificationType: 'scheduled'
      });
    }

    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/process`,
      data: { timestamp: nextOccurrence.getTime() },
      scheduled: nextOccurrence.getTime()
    });
  }

  return NextResponse.json({ success: true });
});


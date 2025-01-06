// app/api/notifications/schedule/route.ts

import { NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { supabase } from '@/lib/supabaseClient';
import { queueNotification } from '@/lib/upstash';

const qstash = new Client({
  token: process.env.UPSTASH_QSTASH_TOKEN!
});

// Helper to get next occurrence of a schedule
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

// Process scheduled notifications
export async function POST() {
  try {
    // Get all active scheduled notifications
    const { data: scheduledNotifications, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    for (const notification of scheduledNotifications || []) {
      const nextOccurrence = getNextOccurrence(notification);

      // Get all users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, timezone');

      if (!users) continue;

      // Queue notifications for each user
      for (const user of users) {
        // Adjust time for user's timezone
        const userTime = new Date(nextOccurrence.toLocaleString('en-US', {
          timeZone: user.timezone || 'UTC'
        }));

        // Replace variables in message
        let message = notification.message;
        
        // Get todo count if needed
        if (message.includes('{todoCount}')) {
          const { count: todoCount } = await supabase
            .from('todos')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('completed', false);
          
          message = message.replace('{todoCount}', todoCount?.toString() || '0');
        }

        // Get brainstorm count if needed
        if (message.includes('{brainstormCount}')) {
          const { count: brainstormCount } = await supabase
            .from('brainstorm')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          message = message.replace('{brainstormCount}', brainstormCount?.toString() || '0');
        }

        // Queue the notification
        await queueNotification({
          userId: user.id,
          title: notification.title,
          message,
          scheduledFor: userTime,
          notificationType: 'scheduled'
        });
      }

      // Schedule next processing with QStash
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/process`,
        data: { timestamp: nextOccurrence.getTime() },
        scheduled: nextOccurrence.getTime()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule notifications' },
      { status: 500 }
    );
  }
}
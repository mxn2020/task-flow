// app/api/cron/process-notifications/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { NotificationManager } from '@/lib/notifications';
import { AppError } from '@/lib/errors/types';

export async function GET() {
  const { data: notifications, error } = await supabase
    .from('notification_queue')
    .select('*')
    .is('sent_at', null)
    .lte('scheduled_for', new Date().toISOString());

  if (error) {
    throw new AppError('Failed to fetch notifications', 500, 'DATABASE_ERROR');
  }

  for (const notification of notifications || []) {
    try {
      await NotificationManager.sendNotification(
        notification.user_id,
        notification.title,
        notification.message,
        {
          itemId: notification.item_id,
          itemType: notification.scope_type
        }
      );

      await supabase
        .from('notification_queue')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notification.id);

    } catch (error) {
      console.error(`Failed to process notification ${notification.id}:`, error);
    }
  }

  return NextResponse.json({ 
    success: true, 
    processed: notifications?.length || 0 
  });
}


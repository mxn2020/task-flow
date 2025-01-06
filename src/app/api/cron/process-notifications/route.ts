// app/api/cron/process-notifications/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { NotificationManager } from '@/lib/notifications';

export async function GET() {
  try {
    // Get all pending notifications that are due
    const { data: notifications, error } = await supabase
      .from('notification_queue')
      .select('*')
      .is('sent_at', null)
      .lte('scheduled_for', new Date().toISOString());

    if (error) throw error;

    // Process each notification
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

        // Mark as sent
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

  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process notifications' 
    }, { status: 500 });
  }
}
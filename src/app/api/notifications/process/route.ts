// app/api/notifications/process/route.ts

import { NextResponse } from 'next/server';
import { getScheduledNotifications, removeProcessedNotification } from '@/lib/upstash';
import { supabase } from '@/lib/supabaseClient';
import webpush from 'web-push';
import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { NextRequest } from 'next/server';

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function handleNotification(notification: any) {
  try {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', notification.userId);

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', notification.userId)
      .single();

    if (!settings?.notifications_enabled) return;

    await supabase.from('notification_history').insert({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      notification_type: notification.notificationType,
      item_id: notification.itemId,
      item_type: notification.itemType,
      created_at: new Date().toISOString()
    });

    if (settings.push_enabled && subscriptions) {
      const pushPromises = subscriptions.map(sub => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh
          }
        };

        return webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: notification.title,
            message: notification.message,
            soundEnabled: settings.sound_enabled,
            url: notification.itemId ? `/${notification.itemType}/${notification.itemId}` : undefined
          })
        );
      });

      await Promise.allSettled(pushPromises);
    }

    await removeProcessedNotification(notification.key);
  } catch (error) {
    console.error('Error processing notification:', error);
    throw error;
  }
}

const handler = async (req: NextRequest) => {

  try {
    const now = Date.now();
    const notifications = await getScheduledNotifications(0, now);

    await Promise.all(
      notifications.map(notification => handleNotification(notification))
    );

    return NextResponse.json({
      success: true,
      processed: notifications.length
    });
  } catch (error) {
    console.error('Error in notification processor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
};

export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: process.env.UPSTASH_QSTASH_TOKEN
});

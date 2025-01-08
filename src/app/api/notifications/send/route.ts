// app/api/notifications/send/route.ts

import { withAuth } from "@/lib/api-middleware";
import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import { AppError } from '@/lib/errors/types';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificationPayload {
  title: string;
  message: string;
  userId: string;
  soundEnabled?: boolean;
}

export const POST = withAuth(async (req: NextRequest) => {
  const payload: NotificationPayload = await req.json();
  const { title, message, userId, soundEnabled = false } = payload;

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (subscriptions) {
    const notifications = subscriptions.map(sub => {
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
          title,
          message,
          soundEnabled
        })
      );
    });

    await Promise.allSettled(notifications);
  }

  const { error: insertError } = await supabase.from('notification_history').insert({
    user_id: userId,
    title,
    message,
    created_at: new Date().toISOString()
  });

  if (insertError) {
    throw new AppError('Failed to save notification', 500, 'DATABASE_ERROR');
  }

  return NextResponse.json({ success: true });
});
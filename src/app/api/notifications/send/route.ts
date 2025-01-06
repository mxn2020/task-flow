// app/api/notifications/send/route.ts

import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import webpush from 'web-push';

// Initialize web-push
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
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

    await supabase.from('notification_history').insert({
      user_id: userId,
      title,
      message,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
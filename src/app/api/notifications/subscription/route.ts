// app/api/notifications/subscription/route.ts
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const vapidDetails = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
  subject: 'mailto:your-email@example.com'
};

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const subscription = await req.json();
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return new NextResponse('Subscription saved', { status: 200 });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


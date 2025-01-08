// app/api/notifications/subscription/route.ts

import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/types';
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

export const POST = withAuth(async (req: NextRequest, context: any, session: any) => {
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

  if (error) throw new AppError('Failed to save subscription', 500, 'DATABASE_ERROR');

  return NextResponse.json({ message: 'Subscription saved' });
});


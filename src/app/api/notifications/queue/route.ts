// app/api/notifications/queue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

const qstash = new Client({
  token: process.env.UPSTASH_QSTASH_TOKEN!
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { title, message, scheduledFor, userId } = await req.json();

    // Store in notification queue
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

    if (error) throw error;

    // Schedule with QStash
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/process`,
      data: { notificationId: data.id },
      scheduled: new Date(scheduledFor).getTime()
    });

    return NextResponse.json({
      success: true,
      notification: data
    });

  } catch (error) {
    console.error('Error queueing notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to queue notification' },
      { status: 500 }
    );
  }
}
// app/api/notifications/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    //if (error) throw error;

    return NextResponse.json(data || {
      notificationsEnabled: true,
      soundEnabled: true,
      pushEnabled: true,
      browserEnabled: true,
      firstReminderTime: '1440',
      secondReminderTime: '60',
      timezone: 'UTC'
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const settings = await req.json();
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: session.user.id,
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return new NextResponse('Settings updated', { status: 200 });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


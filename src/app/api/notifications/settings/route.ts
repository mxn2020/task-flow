// app/api/notifications/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors/types';

const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  soundEnabled: true,
  pushEnabled: true,
  browserEnabled: true,
  firstReminderTime: '1440',
  secondReminderTime: '60',
  timezone: 'UTC'
};

export const GET = withAuth(async (req: Request, context: any, session: any) => {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore "not found" error
    throw new AppError('Failed to fetch settings', 500, 'DATABASE_ERROR');
  }

  return NextResponse.json(data || DEFAULT_SETTINGS);
});

export const POST = withAuth(async (req: NextRequest, context: any, session: any) => {
  const settings = await req.json();
  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: session.user.id,
      ...settings,
      updated_at: new Date().toISOString()
    });

  if (error) throw new AppError('Failed to update settings', 500, 'DATABASE_ERROR');

  return NextResponse.json({ message: 'Settings updated' });
});


// app/api/admin/scheduled-notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { isSuperAdmin } from '@/lib/adminUtils';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!await isSuperAdmin(session.user.id)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!await isSuperAdmin(session.user.id)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const notification = await req.json();
    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        ...notification,
        created_by: session.user.id
      });

    if (error) throw error;

    return new NextResponse('Notification created', { status: 200 });
  } catch (error) {
    console.error('Error creating scheduled notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


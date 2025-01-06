// app/api/admin/scheduled-notifications/[id]/route.ts

import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from '@/lib/adminUtils';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  
    if (!await isSuperAdmin(session.user.id)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  
    try {
      const updates = await req.json();
      const { error } = await supabase
        .from('scheduled_notifications')
        .update(updates)
        .eq('id', id);
  
      if (error) throw error;
  
      return new NextResponse('Notification updated', { status: 200 });
    } catch (error) {
      console.error('Error updating scheduled notification:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
  
  export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  
    if (!await isSuperAdmin(session.user.id)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
  
      return new NextResponse('Notification deleted', { status: 200 });
    } catch (error) {
      console.error('Error deleting scheduled notification:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
// app/api/notifications/history/route.ts

import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
  
      if (error) throw error;
  
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
// app/api/admin/users/[id]/role/route.ts

import { withAuth } from '@/lib/api-middleware';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const PATCH = withAuth(async (req: Request, { params }: { params: { id: string } }, session: any) => {
  if (session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { role } = await req.json();
  
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});


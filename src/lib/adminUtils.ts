// lib/adminUtils.ts
import { supabase } from '@/lib/supabaseClient';

export async function isSuperAdmin(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', userId)
    .single();
  
  return data?.is_superadmin || false;
}
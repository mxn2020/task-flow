// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { SupabaseConfigError } from './errors/supabaseErrors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new SupabaseConfigError('NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new SupabaseConfigError('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

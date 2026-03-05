import { execSync } from 'node:child_process';
import type { Database } from '../supabase/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient<Database>;

export function getSupabaseClient() {
  if (supabase) return supabase;
  const { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } = process.env;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing from .env');
  }
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL missing from .env');
  }
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return supabase;
}

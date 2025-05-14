import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/index.ts';

export { SupabaseClient };

export const getClient = (req?: Request) => {
  // Create a Supabase client with the Auth context of the logged in user.
  const headers: Record<string, string> = { 'x-my-custom-header': 'my-app-name' };
  if (req) {
    headers.Authorization = req.headers.get('Authorization') || '';
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl) throw new Error('SUPABASE_URL is required.');
  if (!supabaseKey) throw new Error('SUPABASE_ANON_KEY is required.');

  return createClient<Database>(
    // Supabase API URL - env var exported by default.
    supabaseUrl,
    // Supabase API ANON KEY - env var exported by default.
    supabaseKey,
    // Create client with Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    // { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers,
      },
    }
  );
};

export const getServiceRoleClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

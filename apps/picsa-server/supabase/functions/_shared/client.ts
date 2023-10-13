import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/index.ts';

export { SupabaseClient };

export const getClient = (req: Request) => {
  // Create a Supabase client with the Auth context of the logged in user.
  return createClient<Database>(
    // Supabase API URL - env var exported by default.
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase API ANON KEY - env var exported by default.
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
        headers: { 'x-my-custom-header': 'my-app-name', Authorization: req.headers.get('Authorization') || '' },
      },
    }
  );
};

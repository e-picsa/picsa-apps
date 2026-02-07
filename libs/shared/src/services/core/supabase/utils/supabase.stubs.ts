import { Database } from '@picsa/server-types';
import { SupabaseClient } from '@supabase/supabase-js';

/** Check if supabase dev server is available, to allow fallback to stub server   */
export async function checkBackendAvailability(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 500); // short timeout

    await fetch(`${url}/auth/v1/health`, { signal: controller.signal }).catch(async () => {
      // Fallback: try checking just the root if specific health check fails/not standard
      return fetch(url, { signal: controller.signal });
    });

    clearTimeout(id);
    return true; // If we got a response (even 404), the server is running.
  } catch (err) {
    console.warn('[Supabase] Backend unavailable - switching to offline/stub mode');
    return false;
  }
}

export function createOfflineSupabaseClient(): SupabaseClient<Database> {
  // Mock Admin User
  const mockUser = {
    id: 'mock-admin-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'admin@stub.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: 'Mock Admin' },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    factors: [],
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  };

  const stubClient = {
    auth: {
      onAuthStateChange: () => {
        // Return a subscription that does nothing
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                /* no-op */
              },
            },
          },
        };
      },
      getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null }),
      signInAnonymously: () => Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null }),
      signUp: () => Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
      updateUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      refreshSession: () => Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: () => Promise.resolve({ error: { message: 'Offline Mode' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: [], error: null }),
      }),
    },
    functions: {
      invoke: () => Promise.resolve({ error: { message: 'Offline Mode' } }),
    },
    // Realtime subscription stub
    channel: (_topic: string) => ({
      on: (_type: string, _filter: any, _callback: (payload: any) => void) => ({
        subscribe: () => ({
          unsubscribe: () => null,
        }),
      }),
      subscribe: () => null,
      unsubscribe: () => null,
    }),
    removeChannel: (_channel: any) => Promise.resolve('ok'),
    // The 'from' method handles DB queries
    from: (table: string) => createStubQueryBuilder(table),
  };

  return stubClient as unknown as SupabaseClient<Database>;
}

function createStubQueryBuilder(_table: string) {
  // Override standard builder methods to return empty results/promises
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stubBuilder: any = {
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: () => stubBuilder,
    in: () => stubBuilder,
    like: () => stubBuilder, // Added for storage service usage
    order: () => stubBuilder,
    limit: () => stubBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return stubBuilder;
}

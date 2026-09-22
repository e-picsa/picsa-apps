/**
 * Environment detection utility for Supabase edge functions
 */

export function isDevEnvironment(): boolean {
  const env = Deno.env.get('ENVIRONMENT');
  if (env) {
    return env === 'development' || env === 'local' || env === 'test';
  }
  // Fallback: detect local Supabase URL
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  return (
    supabaseUrl.includes('localhost') ||
    supabaseUrl.includes('127.0.0.1') ||
    supabaseUrl.includes('host.docker.internal')
  );
}

/**
 * Debugging pathway: allows developers running locally to bypass mock stubs
 * and execute calls against the live external Climate API by setting:
 * USE_PROD_CLIMATE_API=true in .env.local
 */
export function useProdClimateApi(): boolean {
  return Deno.env.get('USE_PROD_CLIMATE_API') === 'true';
}

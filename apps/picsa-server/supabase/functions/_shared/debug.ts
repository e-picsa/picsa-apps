import { getServiceRoleClient } from './client.ts';

/**
 * Write log to `public.debug_logs` table
 *
 * Supabase edge function doesn't appear to track console logs,
 * so temp work around for function debugging
 */
export async function writeDebugLog(payload: Record<string, unknown>) {
  const supabase = getServiceRoleClient();

  return await supabase.from('debug_logs' as any).insert({
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString(),
  });
}

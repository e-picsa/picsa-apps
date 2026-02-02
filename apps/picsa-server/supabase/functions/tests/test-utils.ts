import { load } from 'https://deno.land/std@0.204.0/dotenv/mod.ts';
import type { FunctionInvokeOptions } from 'https://esm.sh/v133/@supabase/functions-js@2.1.5/dist/module/index.js';
import { dirname, fromFileUrl, resolve } from 'https://deno.land/std@0.188.0/path/mod.ts';
import { getClient } from '../_shared/client.ts';

const __dirname = dirname(fromFileUrl(import.meta.url));

/** Load .env and .env.local files as well as setting local supabase api url */
export async function setupTestEnv() {
  await load({ envPath: resolve(__dirname, '../.env'), export: true });
  await load({ envPath: resolve(__dirname, '../.env.test'), export: true });
  Deno.env.set('SUPABASE_URL', 'http://localhost:54321');
  Deno.env.set('TEST', 'true');
}

/**
 * Hack - workaround functions invoke method to allow passing back unformatted fetch result (used in tests)
 * Also returns status and statusText alongside error and data information
 * https://github.com/supabase/functions-js/blob/main/src/FunctionsClient.ts
 */
export async function invokeSupabaseFunctionFetch(name: string, options: FunctionInvokeOptions = {}) {
  const request = generateSupabaseFetchRequest(name, options);
  const res = await fetch(request);
  let data: Record<string, string> | null = null;
  if (res.body) {
    const contentType = res.headers.get('Content-type');
    switch (contentType) {
      case 'application/json':
        data = await res.json();
        break;
      default:
        data = { text: await res.text() };
        break;
    }
  }
  const { status, statusText } = res;
  // TODO - default invoke also parses body in more ways
  return { status, statusText, data };
}

/**
 * Invoke supabase function
 * NOTE - any non 2xx status codes will not be returned, instead throwing error
 * https://github.com/supabase/functions-js/issues/65
 *
 */
export async function invokeSupabaseFunction(name: string, options: FunctionInvokeOptions = {}) {
  const client = getClient();
  return await client.functions.invoke(name, options);
}

/** Create a mock Request object for testing serve handlers directly */
export function mockSupabaseRequest(name: string, options: FunctionInvokeOptions) {
  return generateSupabaseFetchRequest(name, options);
}

/** Generate request object to eecute as part of tests or pass to mock methods */
function generateSupabaseFetchRequest(name: string, options: FunctionInvokeOptions = {}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl) throw new Error('SUPABASE_URL is required.');
  if (!supabaseKey) throw new Error('SUPABASE_ANON_KEY is required.');
  const requestOptions: RequestInit = {
    method: options.method || 'POST',
    headers: { ...options.headers, Authorization: `Bearer ${supabaseKey}` },
  };
  if (options.body) {
    if (options.body.constructor === {}.constructor) {
      requestOptions.body = JSON.stringify(options.body);
      requestOptions.headers = { ...requestOptions.headers, ['Content-Type']: 'application/json' };
    } else {
      // TODO - default method would set more headers depending on body, assume test will structure correctly
      requestOptions.body = options.body as any;
    }
  }
  return new Request(`${supabaseUrl}/functions/v1/${name}`, requestOptions);
}

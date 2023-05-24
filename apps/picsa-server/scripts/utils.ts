import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { resolve, dirname, fromFileUrl } from 'https://deno.land/std@0.188.0/path/mod.ts';

/**
 * Execute supabase cli command
 * @param args list of cli command args, e.g. ['gen','types','--schema','public]
 */
export function supabaseCLIExec(args: string[]) {
  const __dirname = dirname(fromFileUrl(import.meta.url));
  const binPath = resolve(__dirname, '../../../node_modules/supabase/bin/supabase.exe');
  const command = new Deno.Command(binPath, { args });

  return command.output();
}

export function supabaseDBUrl() {
  // Load environment variables from local docker project to configure db connection url
  const __dirname = dirname(fromFileUrl(import.meta.url));
  const envPath = resolve(__dirname, '../', 'docker', '.env');
  const env = config({ path: envPath, export: true });
  const { POSTGRES_DB, POSTGRES_PORT, POSTGRES_PASSWORD } = env;
  // NOTE - in container environment will be env host (e.g. 'db'), use localhost externally
  const POSTGRES_HOST = 'localhost';
  const dbUrl = `postgresql://${POSTGRES_DB}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;
  return dbUrl;
}

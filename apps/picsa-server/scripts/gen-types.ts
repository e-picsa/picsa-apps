import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { resolve, dirname, fromFileUrl } from 'https://deno.land/std@0.188.0/path/mod.ts';

/**
 * Script to run supabase type gen utility against local docker instance
 * https://supabase.com/docs/guides/api/rest/generating-types
 * https://github.com/supabase/cli/blob/main/cmd/gen.go
 *
 * deno run --allow-env --allow-read --allow-run --allow-write scripts/gen-types.ts
 */
export async function genTypes() {
  const __dirname = dirname(fromFileUrl(import.meta.url));

  const envPath = resolve(__dirname, '../', 'docker', '.env');
  const binPath = resolve(__dirname, '../../../node_modules/supabase/bin/supabase.exe');
  const outPath = resolve(__dirname, '../types/supabase.ts');

  const env = config({ path: envPath, export: true });
  const { POSTGRES_DB, POSTGRES_PORT, POSTGRES_PASSWORD } = env;

  // NOTE - in container environment will be env host (e.g. 'db'), use localhost externally
  const POSTGRES_HOST = 'localhost';
  const dbUrl = `postgresql://${POSTGRES_DB}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

  const command = new Deno.Command(binPath, {
    args: ['gen', 'types', 'typescript', '--db-url', dbUrl, '--schema', 'public'],
  });

  const { stdout, stderr } = await command.output();
  if (stderr) {
    const err = new TextDecoder().decode(stderr);
    console.error(err);
  }
  if (stdout) {
    Deno.writeFileSync(outPath, stdout);
    console.log('Type definitions written\n', outPath);
  }
}
genTypes();

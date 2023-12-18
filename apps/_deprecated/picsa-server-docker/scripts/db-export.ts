import { dirname, fromFileUrl, resolve } from 'https://deno.land/std@0.188.0/path/mod.ts';
import { supabaseCLIExec, supabaseDBUrl } from './utils.ts';

/**
 * Script to export supabase db schema
 * https://supabase.com/docs/reference/cli/supabase-db-reset
 *
 * deno run --allow-env --allow-read --allow-run --allow-write scripts/db-export.ts
 */
export async function dbExport() {
  const dbUrl = supabaseDBUrl();
  const __dirname = dirname(fromFileUrl(import.meta.url));

  const targets = [
    // { filename: 'roles.sql', arg: '--role-only' },
    // { filename: 'data.sql', arg: '--data-only' },
    { filename: 'schema.sql', arg: '' },
  ];
  for (const { filename, arg } of targets) {
    const schemaOutput = resolve(__dirname, filename);
    const args = ['db', 'dump', '--db-url', dbUrl, '-f', schemaOutput, arg];
    const { stdout, stderr } = await supabaseCLIExec(args);
    if (stderr) {
      const err = new TextDecoder().decode(stderr);
      console.error(err);
    }
    if (stdout) {
      // Deno.writeFileSync(outPath, stdout);
      console.log(stdout.toString());
    }
  }
}
dbExport();

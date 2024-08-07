import { dirname, fromFileUrl, resolve } from 'https://deno.land/std@0.188.0/path/mod.ts';
import { supabaseCLIExec, supabaseDBUrl } from './utils.ts';

/**
 * Script to run supabase type gen utility against local docker instance
 * https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#backup-your-old-database
 *
 * TODO - handle output target and import to new docker container
 *
 * deno run --allow-env --allow-read --allow-run --allow-write scripts/db-export.ts
 */
export async function dbImport() {
  const dbUrl = supabaseDBUrl();
  const __dirname = dirname(fromFileUrl(import.meta.url));

  const targets = [{ filename: 'schema.sql', arg: '' }];
  for (const { filename, arg } of targets) {
    const schemaInput = resolve(__dirname, filename);
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
dbImport();

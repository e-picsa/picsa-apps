import { supabaseCLIExec, supabaseDBUrl } from './utils.ts';

/**
 * Script to run supabase type gen utility against local docker instance
 * https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#backup-your-old-database
 *
 * TODO - handle output target and import to new docker container
 *
 * deno run --allow-env --allow-read --allow-run --allow-write scripts/db-migrate.ts
 */
async function migrate() {
  console.log('migrating');
  const dbUrl = supabaseDBUrl();
  const args = ['db', 'reset', '--db-url', dbUrl];
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
migrate();

// TODO
// https://github.com/supabase/postgres/tree/develop/migrations#supabasemigrations
// https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#backup-your-old-database
// https://github.com/amacneil/dbmate
// Could likely just be configured with docker-compose (use script to populate)
// https://github.com/supabase/postgres/blob/develop/migrations/docker-compose.yaml

import { supabaseCLIExec } from './utils.ts';

/**
 * Wrapper to call supabase cli from picsa-server workspace
 *
 * https://github.com/supabase/supabase/issues/15562
 */
async function supabase() {
  console.log('supabase', Deno.args);
  const { stdout, stderr } = await supabaseCLIExec(Deno.args);
  if (stderr) {
    const err = new TextDecoder().decode(stderr);
    console.error(err);
  }
  if (stdout) {
    // Deno.writeFileSync(outPath, stdout);
    console.log(new TextDecoder().decode(stdout));
  }
}
supabase();

// TODO
// https://github.com/supabase/postgres/tree/develop/migrations#supabasemigrations
// https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#backup-your-old-database
// https://github.com/amacneil/dbmate
// Could likely just be configured with docker-compose (use script to populate)
// https://github.com/supabase/postgres/blob/develop/migrations/docker-compose.yaml

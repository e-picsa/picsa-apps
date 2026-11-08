/**
 * App-scoped database backup (schema + data, no platform schemas) into
 * `db_schema.sql` and `db_data.sql`. For a portable full backup instead, see
 * backup-db-full.ts. Used by the unified backup.ts entry point, or standalone
 * (produces a dated `<date>_db.tar.gz` archive).
 *
 * Invoke:
 *   yarn nx run picsa-server:backup [-- --no-storage]
 *   yarn tsx scripts/backup/backup-db.ts (standalone, from apps/picsa-server)
 *
 * Requires:
 *   Linked Supabase CLI (`npx supabase link --project-ref <REF>` from
 *   apps/picsa-server), or SUPABASE_DB_URL / SUPABASE_PROJECT_ID.
 *
 * Optional:
 *   SUPABASE_BACKUP_SCHEMAS  Comma-separated schemas (default: discovered
 *                    from config.toml and migrations).
 *   SUPABASE_EXCLUDE_TABLES  Comma-separated schema.tables to skip in the
 *                    data dump (default: public.app_users,
 *                    public.user_profiles, public.forecasts,
 *                    public.climate_station_data).
 */
import execa from 'execa';
import fs from 'fs';
import path from 'path';

import { checkSupabaseLinkStatus, getAppSchemas, getExcludedTables } from '../utils/supabase.utils';
import { archiveAndClean, backupRootDir, dbArchiveName, stagingDir } from './backup.utils';

const serverRootDir = path.resolve(__dirname, '../..');

export async function backupDatabase(outDir: string) {
  console.log('Checking Supabase connection status...');
  const linkStatus = checkSupabaseLinkStatus();

  if (!linkStatus.isLinked) {
    console.error('\n❌ Error: Supabase CLI is not linked to a remote project.');
    console.error('Please run the following command from apps/picsa-server to link your project:');
    console.error('  npx supabase link --project-ref <YOUR_PROJECT_REF>\n');
    console.error('Or set SUPABASE_DB_URL or SUPABASE_PROJECT_ID in your environment.\n');
    process.exit(1);
  }

  if (linkStatus.projectRef) {
    console.log(`Linked remote project reference: ${linkStatus.projectRef}`);
  }

  const appSchemas = getAppSchemas();
  const excludedTables = getExcludedTables();

  console.log(`Application schemas dynamically discovered: ${appSchemas.join(', ')}`);
  if (excludedTables.length > 0) {
    console.log(`Tables excluded from data dump: ${excludedTables.join(', ')}`);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const schemaFile = path.join(outDir, 'db_schema.sql');
  const dataFile = path.join(outDir, 'db_data.sql');

  const baseArgs = linkStatus.dbUrl ? ['--db-url', linkStatus.dbUrl] : ['--linked'];
  const schemaArgs = ['-s', appSchemas.join(',')];
  const excludeArgs = excludedTables.length > 0 ? ['-x', excludedTables.join(',')] : [];

  try {
    console.log(`\n[+] Dumping DB Schema to ${schemaFile}...`);
    await execa('npx', ['supabase', 'db', 'dump', ...baseArgs, ...schemaArgs, '-f', schemaFile], {
      cwd: serverRootDir,
      stdio: 'inherit',
    });

    console.log(`[+] Dumping DB Data to ${dataFile}...`);
    await execa(
      'npx',
      [
        'supabase',
        'db',
        'dump',
        ...baseArgs,
        ...schemaArgs,
        ...excludeArgs,
        '--data-only',
        '--use-copy',
        '-f',
        dataFile,
      ],
      {
        cwd: serverRootDir,
        stdio: 'inherit',
      },
    );

    console.log('\n✅ Database backup completed successfully.');
    console.log(`   Schema: ${schemaFile}`);
    console.log(`   Data:   ${dataFile}`);
  } catch (error: any) {
    console.error('\n❌ Database backup failed:', error?.message || error);
    formatErrorGuidance(error?.message || String(error));
    process.exit(1);
  }
}

function formatErrorGuidance(errorMessage: string) {
  if (
    errorMessage.includes('Not logged in') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('access token')
  ) {
    console.error('\n💡 Troubleshooting: You need to authenticate with Supabase CLI.');
    console.error('  Run: npx supabase login\n');
  } else if (errorMessage.includes('password') || errorMessage.includes('authentication failed')) {
    console.error('\n💡 Troubleshooting: Database password is required.');
    console.error('  Set SUPABASE_DB_PASSWORD environment variable or provide password when prompted.\n');
  }
}

if (require.main === module) {
  void backupDatabaseStandalone();
}

async function backupDatabaseStandalone() {
  const stageDir = stagingDir('db');
  fs.mkdirSync(stageDir, { recursive: true });
  await backupDatabase(stageDir);
  await archiveAndClean(stageDir, path.join(backupRootDir, dbArchiveName(false)));
}

import execa from 'execa';
import fs from 'fs';
import path from 'path';

import { checkSupabaseLinkStatus, getAppSchemas, getExcludedTables } from '../utils/supabase.utils';

const backupDir = path.resolve(__dirname, './backups');
const serverRootDir = path.resolve(__dirname, '../..');

export async function backupDatabase() {
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

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const schemaFile = path.join(backupDir, `db_schema_${timestamp}.sql`);
  const dataFile = path.join(backupDir, `db_data_${timestamp}.sql`);

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
  backupDatabase();
}

/**
 * Full remote database backup (Supabase CLI docs recipe: roles + schema + data
 * + migration history) into `scripts/backup/backups/db_full_<timestamp>/`.
 *
 * Invoke:
 *   yarn nx run picsa-server:backup-db-full
 *
 * Requires:
 *   SUPABASE_DB_URL  Direct connection string (port 5432, NOT the :6543
 *                    transaction pooler). Via shell export or
 *                    apps/picsa-server/.env.server - see .env.server.example.
 *   Docker running   The v2 CLI runs dumps inside Docker.
 *
 * Optional:
 *   SUPABASE_FULL_EXCLUDE_TABLES  Comma-separated schema.tables to skip in the
 *                    data dump (default: storage.buckets_vectors,
 *                    storage.vector_indexes). Set to "" to exclude nothing.
 */
import execa from 'execa';
import fs from 'fs';
import path from 'path';

import { loadEnv, loadEnvLocal, loadEnvServer } from '../utils/supabase.utils';

const backupDir = path.resolve(__dirname, './backups');

/**
 * Docs-shaped backup, not byte-full: `supabase db dump` always strips platform
 * schemas (auth, storage, ...) and sanitises output so it restores cleanly.
 * See: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
 * Custom auth/storage objects and migration history need the extra steps below.
 */
const DEFAULT_EXCLUDE_TABLES = ['storage.buckets_vectors', 'storage.vector_indexes'];

export async function backupDatabaseFull() {
  loadEnv();
  loadEnvServer();
  loadEnvLocal();

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('\n❌ Error: SUPABASE_DB_URL is not set.');
    console.error('  Copy the Direct connection string from the Supabase Dashboard:');
    console.error('    Project Settings → Database → Connection string → Direct connection (port 5432)\n');
    console.error('  Export it for this shell, or add it to apps/picsa-server/.env.server:');
    console.error('    SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres\n');
    process.exit(1);
  }

  const encodedUrl = encodeDbUrl(dbUrl);

  if (hasTransactionPoolerPort(dbUrl)) {
    console.error('\n❌ Error: port 6543 is the transaction-mode pooler, which pg_dump cannot use.');
    console.error('  Use the Direct connection string (port 5432) or the Session pooler instead.\n');
    process.exit(1);
  }
  if (isPoolerHost(dbUrl)) {
    console.warn('⚠️  Pooler connection detected - prefer Direct connection (port 5432) for dumps.');
  }

  try {
    await execa('docker', ['info']);
  } catch {
    console.error('\n❌ Error: Docker is not running.');
    console.error('  The v2 Supabase CLI runs dumps inside Docker - start Docker Desktop and retry.\n');
    process.exit(1);
  }

  // Explicit empty string means "no exclusions"; unset falls back to defaults.
  const excludeTables =
    process.env.SUPABASE_FULL_EXCLUDE_TABLES === undefined
      ? DEFAULT_EXCLUDE_TABLES
      : process.env.SUPABASE_FULL_EXCLUDE_TABLES.split(',')
          .map((t) => t.trim())
          .filter(Boolean);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outDir = path.join(backupDir, `db_full_${timestamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const rolesFile = path.join(outDir, 'roles.sql');
  const schemaFile = path.join(outDir, 'schema.sql');
  const dataFile = path.join(outDir, 'data.sql');
  const historySchemaFile = path.join(outDir, 'history_schema.sql');
  const historyDataFile = path.join(outDir, 'history_data.sql');

  const dumps: { label: string; args: string[] }[] = [
    { label: 'roles', args: ['db', 'dump', '--db-url', encodedUrl, '-f', rolesFile, '--role-only'] },
    { label: 'schema', args: ['db', 'dump', '--db-url', encodedUrl, '-f', schemaFile] },
    {
      label: 'data',
      args: [
        'db',
        'dump',
        '--db-url',
        encodedUrl,
        '-f',
        dataFile,
        '--data-only',
        '--use-copy',
        ...(excludeTables.length > 0 ? ['-x', excludeTables.join(',')] : []),
      ],
    },
    {
      label: 'migration history schema',
      args: ['db', 'dump', '--db-url', encodedUrl, '-f', historySchemaFile, '--schema', 'supabase_migrations'],
    },
    {
      label: 'migration history data',
      args: [
        'db',
        'dump',
        '--db-url',
        encodedUrl,
        '-f',
        historyDataFile,
        '--use-copy',
        '--data-only',
        '--schema',
        'supabase_migrations',
      ],
    },
  ];

  try {
    for (const { label, args } of dumps) {
      console.log(`\n[+] Dumping ${label}...`);
      await execa('npx', ['supabase', ...args], { cwd: path.resolve(__dirname, '../..'), stdio: 'inherit' });
    }
  } catch (error: any) {
    console.error('\n❌ Full database backup failed:', error?.message || error);
    console.error(`\n⚠️  Warning: partial backup files may remain in ${outDir} - do not restore from them.`);
    console.error('\n💡 Troubleshooting: verify the Direct connection string, DB password, and network access.');
    console.error('  The password in --db-url must be percent-encoded (handled automatically from SUPABASE_DB_URL).');
    console.error('  Dashboard backups (Project Settings → Backups) remain the primary disaster-recovery path.\n');
    process.exit(1);
  }

  console.log('\n✅ Full database backup completed successfully.');
  console.log(`   Directory: ${outDir}`);
  console.log('\nRestore into a NEW project (from the docs recipe):');
  console.log(`   psql --single-transaction --variable ON_ERROR_STOP=1 \\`);
  console.log(`     --file ${rolesFile} --file ${schemaFile} \\`);
  console.log(`     --command 'SET session_replication_role = replica' \\`);
  console.log(`     --file ${dataFile} --file ${historySchemaFile} --file ${historyDataFile} \\`);
  console.log(`     --dbname "$SUPABASE_DB_URL"`);
  console.log('Note: auth/storage customisations, Vault/pgsodium root keys and extensions');
  console.log('need the separate docs steps - backup files never contain the root key.');
}

/** v2 CLI requires the --db-url value percent-encoded; normalise any raw pasted password. */
function encodeDbUrl(dbUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(dbUrl);
  } catch {
    console.error('\n❌ Error: SUPABASE_DB_URL is not a valid connection string.');
    console.error('  Expected: postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres\n');
    process.exit(1);
  }
  if (!parsed.hostname || !parsed.username) {
    console.error('\n❌ Error: SUPABASE_DB_URL must include host and user.');
    console.error('  Expected: postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres\n');
    process.exit(1);
  }
  if (parsed.password) {
    // Tolerate raw pasted passwords: a literal % outside a valid escape makes
    // decodeURIComponent throw, so fall back to encoding the raw value as-is.
    try {
      parsed.password = encodeURIComponent(decodeURIComponent(parsed.password));
    } catch {
      parsed.password = encodeURIComponent(parsed.password);
    }
  }
  return parsed.toString();
}

function hasTransactionPoolerPort(dbUrl: string): boolean {
  try {
    return new URL(dbUrl).port === '6543';
  } catch {
    return false;
  }
}

function isPoolerHost(dbUrl: string): boolean {
  try {
    return new URL(dbUrl).hostname.includes('pooler.');
  } catch {
    return false;
  }
}

if (require.main === module) {
  void backupDatabaseFull();
}

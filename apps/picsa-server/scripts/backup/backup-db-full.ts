/**
 * Full remote database backup (Supabase CLI docs recipe: roles + schema + data
 * + migration history) into `apps/picsa-server/backups/db_full_<timestamp>/`.
 *
 * Invoke:
 *   yarn nx run picsa-server:backup-db-full
 *
 * Requires:
 *   SUPABASE_DB_URL  Direct connection string (port 5432, NOT the :6543
 *                    transaction pooler). Dashboard → Connect (top of page)
 *                    → Direct connection, with [YOUR-PASSWORD] replaced.
 *                    If the password contains # wrap the whole value in
 *                    quotes (dotenv strips unquoted # as a comment).
 *                    Via shell export or apps/picsa-server/.env.server -
 *                    see .env.server.example.
 *   Docker running   The v2 CLI runs dumps inside Docker.
 *
 * Optional:
 *   SUPABASE_FULL_EXCLUDE_TABLES  Comma-separated schema.tables to skip in the
 *                    data dump (default: storage.buckets_vectors,
 *                    storage.vector_indexes, auth.audit_log_entries,
 *                    auth.mfa_amr_claims, audit.audit_log, auth.sessions,
 *                    auth.refresh_tokens). Set to "" to exclude nothing.
 *                    (auth.users, identities and MFA factors are always kept.)
 */
import execa from 'execa';
import fs from 'fs';
import path from 'path';

import { loadEnv, loadEnvLocal, loadEnvServer } from '../utils/supabase.utils';

const backupDir = path.resolve(__dirname, '../../backups');

/**
 * Docs-shaped backup, not byte-full: `supabase db dump` always strips platform
 * schemas (auth, storage, ...) and sanitises output so it restores cleanly.
 * See: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
 * Custom auth/storage objects and migration history need the extra steps below.
 *
 * auth.audit_log_entries and auth.mfa_amr_claims are excluded from data on top
 * of the docs recipe: append-only auth telemetry and transient MFA challenge
 * state, often high-volume, and restorable without.
 * (To stop audit growth at the source: Dashboard → Authentication →
 * Configuration → Audit Logs → disable "Write audit logs to the database".)
 *
 * audit.audit_log is excluded for the same reason: the app's own row-change
 * history (half-GB scale), restorable without. Trim the live table instead
 * via SELECT audit.cleanup_old_records(<retention_days>).
 *
 * auth.sessions and auth.refresh_tokens are excluded: a project-wide wipe and
 * restore is a global-logout-grade event anyway, and anon devices silently get
 * brand-new identities on next launch. auth.users, identities and MFA factors
 * (who can authenticate) are always kept.
 */
const DEFAULT_EXCLUDE_TABLES = [
  'storage.buckets_vectors',
  'storage.vector_indexes',
  'auth.audit_log_entries',
  'auth.mfa_amr_claims',
  'audit.audit_log',
  'auth.sessions',
  'auth.refresh_tokens',
];

export async function backupDatabaseFull() {
  loadEnv();
  loadEnvServer();
  loadEnvLocal();

  // Template placeholders (e.g. from an unfilled .env.server) count as unset.
  // Mirrors the isPlaceholder convention in supabase.utils.ts.
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl || dbUrl.includes('<') || /your-|example|changeme|placeholder/i.test(dbUrl)) {
    console.error('\n❌ Error: SUPABASE_DB_URL is not set.');
    console.error('  Get the Direct connection string from the Supabase Dashboard:');
    console.error('    Connect (top of page) → Direct connection (port 5432),');
    console.error('    with [YOUR-PASSWORD] replaced by the DB password.');
    console.error('  (IPv4-only network without the IPv4 add-on? Use the Session pooler string instead.)');
    console.error('  If the password contains # wrap the value in quotes in .env.server.\n');
    console.error('  Export it for this shell, or add it to apps/picsa-server/.env.server:');
    console.error('    SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres\n');
    process.exit(1);
  }

  const conn = parseDbUrl(dbUrl);

  if (conn.port === '6543') {
    console.error('\n❌ Error: port 6543 is the transaction-mode pooler, which pg_dump cannot use.');
    console.error('  Use the Direct connection string (port 5432) or the Session pooler instead.\n');
    process.exit(1);
  }
  if (conn.host.includes('pooler.')) {
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
    { label: 'roles', args: ['db', 'dump', '--db-url', conn.encodedUrl, '-f', rolesFile, '--role-only'] },
    { label: 'schema', args: ['db', 'dump', '--db-url', conn.encodedUrl, '-f', schemaFile] },
    {
      label: 'data',
      args: [
        'db',
        'dump',
        '--db-url',
        conn.encodedUrl,
        '-f',
        dataFile,
        '--data-only',
        '--use-copy',
        ...(excludeTables.length > 0 ? ['-x', excludeTables.join(',')] : []),
      ],
    },
    {
      label: 'migration history schema',
      args: ['db', 'dump', '--db-url', conn.encodedUrl, '-f', historySchemaFile, '--schema', 'supabase_migrations'],
    },
    {
      label: 'migration history data',
      args: [
        'db',
        'dump',
        '--db-url',
        conn.encodedUrl,
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
    // Never leak the DB password: execa echoes the full --db-url in its message.
    const message = redactPassword(String(error?.message || error), conn.encodedPassword);
    console.error('\n❌ Full database backup failed:', message);
    console.error(`\n⚠️  Warning: partial backup files may remain in ${outDir} - do not restore from them.`);
    console.error('\n💡 Troubleshooting: verify the Direct connection string, DB password, and network access.');
    console.error('  Percent-encoding is handled automatically, but if the password');
    console.error('  contains # wrap the value in quotes - dotenv strips unquoted # as a comment.');
    console.error('  Dashboard backups remain the primary disaster-recovery path.\n');
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

interface IDbConnection {
  host: string;
  port: string;
  encodedUrl: string;
  encodedPassword: string;
}

/**
 * Parse SUPABASE_DB_URL without WHATWG URL: passwords may contain URL-significant
 * chars (@, #, ?, /) that either break `new URL()` or never reach us (dotenv
 * strips unquoted # as a comment - quote such values in .env.server).
 * The v2 CLI requires --db-url percent-encoded, so the password is normalised
 * here (pre-encoded values round-trip stably, raw values get encoded).
 */
function parseDbUrl(dbUrl: string): IDbConnection {
  // Greedy password up to the LAST @ - hosts never contain @.
  const match = dbUrl.match(/^(postgresql:\/\/)([^:/?#@]+):([\s\S]*)@([^/?#:]+)(?::(\d+))?(\/[^?#]*)?(\?[\s\S]*)?$/);
  if (!match) {
    invalidDbUrl();
  }
  const [, scheme, user, password, host, port, dbPath, query] = match;
  if (!host || !user) {
    invalidDbUrl();
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(password);
  } catch {
    decoded = password;
  }
  const encodedPassword = encodeURIComponent(decoded);
  return {
    host,
    port: port || '5432',
    encodedUrl: `${scheme}${user}:${encodedPassword}@${host}${port ? `:${port}` : ''}${dbPath || '/postgres'}${query || ''}`,
    encodedPassword,
  };
}

/** Redact the password from CLI error output - execa echoes the full --db-url. */
function redactPassword(message: string, encodedPassword: string): string {
  if (!encodedPassword) return message;
  return message.split(encodedPassword).join('<redacted>');
}

function invalidDbUrl(): never {
  console.error('\n❌ Error: SUPABASE_DB_URL is not a valid connection string.');
  console.error('  Expected: postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres');
  console.error('  If the password contains # wrap the value in quotes in .env.server.\n');
  process.exit(1);
}

if (require.main === module) {
  void backupDatabaseFull();
}

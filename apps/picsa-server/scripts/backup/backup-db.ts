import execa from 'execa';
import fs from 'fs';
import path from 'path';

const backupDir = path.resolve(__dirname, './backups');
const serverRootDir = path.resolve(__dirname, '../..');
const projectRefFile = path.resolve(serverRootDir, 'supabase/.temp/project-ref');
const configTomlPath = path.resolve(serverRootDir, 'supabase/config.toml');
const migrationsDir = path.resolve(serverRootDir, 'supabase/migrations');

export interface ILinkStatus {
  isLinked: boolean;
  projectRef?: string;
  dbUrl?: string;
}

export function checkSupabaseLinkStatus(): ILinkStatus {
  if (process.env.SUPABASE_DB_URL) {
    return { isLinked: true, dbUrl: process.env.SUPABASE_DB_URL };
  }

  if (process.env.SUPABASE_PROJECT_ID) {
    return { isLinked: true, projectRef: process.env.SUPABASE_PROJECT_ID };
  }

  if (fs.existsSync(projectRefFile)) {
    const projectRef = fs.readFileSync(projectRefFile, 'utf-8').trim();
    if (projectRef.length > 0) {
      return { isLinked: true, projectRef };
    }
  }

  return { isLinked: false };
}

/**
 * Dynamically discovers application schemas by inspecting:
 * 1. SUPABASE_BACKUP_SCHEMAS environment variable (if specified)
 * 2. API schemas defined in supabase/config.toml
 * 3. Custom schemas defined via CREATE SCHEMA in database migration SQL files
 * Automatically excludes internal Supabase system & platform infrastructure schemas.
 */
export function getAppSchemas(): string[] {
  if (process.env.SUPABASE_BACKUP_SCHEMAS) {
    return process.env.SUPABASE_BACKUP_SCHEMAS.split(',').map((s) => s.trim());
  }

  const detectedSchemas = new Set<string>(['public']);

  // Internal system and infrastructure schemas to exclude
  const excludedSchemas = new Set([
    'graphql_public',
    'graphql',
    'vault',
    'auth',
    'extensions',
    'realtime',
    'pgbouncer',
    'supabase_functions',
    'supabase_migrations',
    'storage',
    'cron',
    'net',
    'information_schema',
    'audit',
  ]);

  // 1. Discover schemas exposed in config.toml
  if (fs.existsSync(configTomlPath)) {
    const configContent = fs.readFileSync(configTomlPath, 'utf-8');
    const schemasMatch = configContent.match(/schemas\s*=\s*\[(.*?)\]/s);
    if (schemasMatch && schemasMatch[1]) {
      const parsedSchemas = schemasMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));

      for (const s of parsedSchemas) {
        if (s && !excludedSchemas.has(s)) {
          detectedSchemas.add(s);
        }
      }
    }
  }

  // 2. Discover custom application schemas created in SQL migrations
  if (fs.existsSync(migrationsDir)) {
    try {
      const entries = fs.readdirSync(migrationsDir, { recursive: true });
      for (const entry of entries) {
        const fileStr = String(entry);
        if (fileStr.endsWith('.sql')) {
          const filePath = path.join(migrationsDir, fileStr);
          const sqlContent = fs.readFileSync(filePath, 'utf-8');
          const matches = sqlContent.matchAll(
            /create\s+schema\s+(?:if\s+not\s+exists\s+)?["`']?([a-zA-Z0-9_]+)["`']?/gi,
          );
          for (const match of matches) {
            const schemaName = match[1]?.toLowerCase();
            if (schemaName && !excludedSchemas.has(schemaName)) {
              detectedSchemas.add(schemaName);
            }
          }
        }
      }
    } catch {
      // Ignore migration scanning errors if folder structure differs
    }
  }

  return Array.from(detectedSchemas);
}

/**
 * Returns tables to exclude from data-only dump.
 * Default: public.app_users, public.user_profiles, public.forecasts, public.climate_station_data
 * Can be overridden via SUPABASE_EXCLUDE_TABLES environment variable.
 */
export function getExcludedTables(): string[] {
  if (process.env.SUPABASE_EXCLUDE_TABLES) {
    return process.env.SUPABASE_EXCLUDE_TABLES.split(',').map((t) => t.trim());
  }

  return ['public.app_users', 'public.user_profiles', 'public.forecasts', 'public.climate_station_data'];
}

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

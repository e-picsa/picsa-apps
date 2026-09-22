import type { Database } from '../../supabase/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let supabase: SupabaseClient<Database>;
let remoteSupabase: SupabaseClient<Database>;
let exportSupabase: SupabaseClient<Database>;

/**
 * Retrieve service-role supabase client using stored env credentials for local Docker development
 */
export function getSupabaseClient() {
  if (supabase) return supabase;
  const { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } = process.env;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing from .env');
  }
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL missing from .env');
  }
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return supabase;
}

/**
 * Load environment variables from apps/picsa-server/.env.server
 * Used for seed export operations requiring remote readonly access
 */
export function loadEnvServer() {
  const serverDir = path.resolve(__dirname, '../../');
  const envServerPath = path.resolve(serverDir, '.env.server');
  if (fs.existsSync(envServerPath)) {
    const dotenv = require('dotenv');
    dotenv.config({ path: envServerPath, override: true });
  }
}

/**
 * Ensures .env.local is loaded if present in apps/picsa-server
 */
export function loadEnvLocal() {
  const serverDir = path.resolve(__dirname, '../../');
  const envLocalPath = path.resolve(serverDir, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const dotenv = require('dotenv');
    dotenv.config({ path: envLocalPath, override: true });
  }
}

/**
 * Retrieve remote project reference from CLI link state or environment
 */
export function getLinkedProjectRef(): string | null {
  const serverRootDir = path.resolve(__dirname, '../..');
  const projectRefFile = path.resolve(serverRootDir, 'supabase/.temp/project-ref');

  if (process.env.SUPABASE_PROJECT_ID) {
    return process.env.SUPABASE_PROJECT_ID;
  }
  if (fs.existsSync(projectRefFile)) {
    const projectRef = fs.readFileSync(projectRefFile, 'utf-8').trim();
    if (projectRef.length > 0) {
      return projectRef;
    }
  }
  return null;
}

/**
 * Retrieve Supabase client specifically targeting REMOTE instance for storage backups.
 * Checks for remote credentials in environment or .env.local:
 * - SUPABASE_REMOTE_URL (or derived https://<projectRef>.supabase.co)
 * - SUPABASE_REMOTE_ANON_KEY
 *
 * NOTE - currently configured just for anon access. Could also be configured for service-role
 * access in future if required
 */
export function getRemoteSupabaseClient() {
  if (remoteSupabase) return remoteSupabase;

  loadEnvLocal();

  let remoteUrl = process.env.SUPABASE_REMOTE_URL;
  if (!remoteUrl) {
    const projectRef = getLinkedProjectRef();
    if (projectRef) {
      remoteUrl = `https://${projectRef}.supabase.co`;
    } else if (
      process.env.SUPABASE_URL &&
      !process.env.SUPABASE_URL.includes('localhost') &&
      !process.env.SUPABASE_URL.includes('127.0.0.1')
    ) {
      remoteUrl = process.env.SUPABASE_URL;
    }
  }

  if (!remoteUrl) {
    console.error('\n❌ Error: Cannot determine remote Supabase URL.');
    console.error('  Please link your project (`npx supabase link --project-ref <REF>`)');
    console.error('  or specify SUPABASE_REMOTE_URL in apps/picsa-server/.env.local\n');
    process.exit(1);
  }

  const apiKey = process.env.SUPABASE_REMOTE_ANON_KEY;

  if (!apiKey) {
    console.error('\n❌ Error: Remote Supabase API key is missing.');
    console.error('  Please set SUPABASE_REMOTE_ANON_KEY in apps/picsa-server/.env.local');
    console.error(`  Target Remote URL: ${remoteUrl}\n`);
    process.exit(1);
  }

  console.log(`[Remote Storage Client] Target Remote Server: ${remoteUrl}\n`);

  remoteSupabase = createClient<Database>(remoteUrl, apiKey);
  return remoteSupabase;
}

/**
 * Retrieve Supabase client for seed export operations.
 * Uses .env.server secret key against the remote database.
 *
 * Why secret key (not publishable):
 * All seed tables revoke anon access (REVOKE ALL FROM anon in
 * 20260129134800_rls_updates.sql, 20260201000000_rls_updates additional.sql,
 * 20260128102700_deploment_admin.sql), require `authenticated` minimum for
 * SELECT, and budget.budgets plus geo.countries/locales are secret-only.
 * Publishable-key export returns 0 rows on most tables.
 *
 * Supported key formats (new Supabase keys preferred, legacy accepted):
 * - Secret:      SUPABASE_REMOTE_SECRET_KEY (sb_secret_...), fallback SUPABASE_REMOTE_SERVICE_ROLE_KEY
 * - Publishable: SUPABASE_REMOTE_PUBLISHABLE_KEY (sb_publishable_...), fallback SUPABASE_REMOTE_ANON_KEY
 *
 * One-way pull guarantee:
 * The seed-export script (scripts/db-seed/db-seed-export.ts) performs only
 * SELECT queries (.select/.eq/.range) plus local CSV writes. It contains no
 * insert/update/delete/upsert/remove calls, so
 * the privileged key can never write to remote even though RLS is bypassed.
 * Keep it that way - do not add write operations to the export path.
 */
export function getExportSupabaseClient(): SupabaseClient<Database> {
  if (exportSupabase) return exportSupabase;

  loadEnvServer();

  const remoteUrl = process.env.SUPABASE_REMOTE_URL;
  // New-style keys first, legacy JWTs as fallback
  const secretKey = process.env.SUPABASE_REMOTE_SECRET_KEY || process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.SUPABASE_REMOTE_PUBLISHABLE_KEY || process.env.SUPABASE_REMOTE_ANON_KEY;

  // Check for missing or template placeholder values (never log key material)
  const isPlaceholder = (val: string | undefined) =>
    !val || val.includes('<') || val.includes('your-') || /example|changeme|placeholder/i.test(val);

  if (isPlaceholder(remoteUrl)) {
    console.error('\n❌ Error: Remote URL not configured in .env.server.');
    console.error('  Copy apps/picsa-server/.env.server.example to .env.server and set:');
    console.error('    SUPABASE_REMOTE_URL=https://<your-project-ref>.supabase.co\n');
    process.exit(1);
  }

  if (!isPlaceholder(secretKey)) {
    // Project ref is treated as sensitive - log key type only, never the URL
    console.log(`[Seed Export Client] Connected with secret key (pull-only)\n`);
    exportSupabase = createClient<Database>(remoteUrl, secretKey);
    return exportSupabase;
  }

  if (!isPlaceholder(publishableKey)) {
    console.error('\n⚠️  Warning: only a publishable key is configured - RLS will block most seed tables.');
    console.error('  Expect skipped tables except on RLS-open tables.');
    console.error('  For full export, set SUPABASE_REMOTE_SECRET_KEY in .env.server instead.\n');
    console.log(`[Seed Export Client] Connected with publishable key (pull-only)\n`);
    exportSupabase = createClient<Database>(remoteUrl, publishableKey);
    return exportSupabase;
  }

  console.error('\n❌ Error: No remote API key configured in .env.server.');
  console.error('  Copy apps/picsa-server/.env.server.example to .env.server and set one of:');
  console.error('    SUPABASE_REMOTE_SECRET_KEY=<sb-secret-key>         (recommended, full export)');
  console.error('    SUPABASE_REMOTE_PUBLISHABLE_KEY=<sb-publishable-key> (limited, RLS-enforced)');
  console.error('  Legacy service_role / anon keys are also accepted as fallbacks.');
  console.error('  Find keys in Supabase Dashboard → Settings → API\n');
  process.exit(1);
}

/**
 * Check Supabase CLI link status for backup operations
 */
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

  const serverRootDir = path.resolve(__dirname, '../..');
  const projectRefFile = path.resolve(serverRootDir, 'supabase/.temp/project-ref');

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

  const serverRootDir = path.resolve(__dirname, '../..');
  const configTomlPath = path.resolve(serverRootDir, 'supabase/config.toml');
  const migrationsDir = path.resolve(serverRootDir, 'supabase/migrations');

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

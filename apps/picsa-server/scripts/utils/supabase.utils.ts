import type { Database } from '../../supabase/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let supabase: SupabaseClient<Database>;
let remoteSupabase: SupabaseClient<Database>;

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
 * Ensures .env.local is loaded if present in apps/picsa-server
 */
export function loadEnvLocal() {
  const serverDir = path.resolve(__dirname, '../../');
  const envLocalPath = path.resolve(serverDir, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    try {
      const dotenv = require('dotenv');
      dotenv.config({ path: envLocalPath, override: true });
    } catch {
      // Ignore if dotenv is not available
    }
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
 * - SUPABASE_REMOTE_ANON_KEY / SUPABASE_REMOTE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
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

  const apiKey =
    process.env.SUPABASE_REMOTE_ANON_KEY ||
    process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY ||
    (process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.includes('eyJpc3MiOiJzdXBhYmFzZS1kZW1v')
      ? process.env.SUPABASE_ANON_KEY
      : '') ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('eyJpc3MiOiJzdXBhYmFzZS1kZW1v')
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : '');

  if (!apiKey) {
    console.error('\n❌ Error: Remote Supabase API key is missing.');
    console.error(
      '  Please set SUPABASE_REMOTE_ANON_KEY (or SUPABASE_REMOTE_SERVICE_ROLE_KEY) in apps/picsa-server/.env.local',
    );
    console.error(`  Target Remote URL: ${remoteUrl}\n`);
    process.exit(1);
  }

  console.log(`[Remote Storage Client] Target Remote Server: ${remoteUrl}\n`);

  remoteSupabase = createClient<Database>(remoteUrl, apiKey);
  return remoteSupabase;
}

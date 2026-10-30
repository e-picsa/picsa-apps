/**
 * Forecast Bundle Sync
 *
 * Pulls live seasonal and downscaled forecasts from Supabase and writes them as
 * per-country JSON bundles ({ seasonal, downscaled }) consumed as the app's offline
 * fallback via libs/data/climate/forecasts. Only rows with a storage_file are exported
 * (tombstoned rows excluded); volatile timestamps are stripped for diff-stable output.
 *
 * Usage:
 *   yarn scripts:forecasts:sync [--country=mw] [--local]
 *
 * Args:
 *   --country=<code>  Only sync one country (mw, zm, zw). Default: all countries
 *   --local           Pull from the local Supabase container instead of remote.
 *                     Default pulls remote via apps/picsa-server/.env.server
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Database } from '@picsa/server-types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type ForecastRow = Database['public']['Tables']['forecasts']['Row'];
/** Bundled rows omit volatile timestamps so output is deterministic across runs */
type IForecastBundleRow = Omit<ForecastRow, 'created_at' | 'updated_at'>;

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const FORECASTS_DIR = path.join(ROOT_DIR, 'libs/data/climate/forecasts');
const SUPPORTED_COUNTRIES = ['mw', 'zm', 'zw'];
const FORECAST_TYPES = ['seasonal', 'downscaled'];

const BUNDLE_COLUMNS =
  'id,forecast_type,location,country_code,language_code,storage_file,mimetype,label,downscaled_location';

interface CliArgs {
  country?: string;
  local?: boolean;
}

function parseCliArgs(argv = process.argv.slice(2)): CliArgs {
  const result: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--local') {
      result.local = true;
      continue;
    }
    const match = arg.match(/^--country[= ](.+)$/) ?? (arg === '--country' ? ['', argv[++i]] : null);
    if (match?.[1]) {
      result.country = match[1].toLowerCase();
    }
  }
  return result;
}

/**
 * Supabase client targeting remote server (default, via .env.server) or local
 * dev container (--local, via .env). Mirrors sync-climate-data.ts conventions.
 */
function getBundleSupabaseClient(options: { local?: boolean } = {}): SupabaseClient {
  const dotenv = require('dotenv');

  if (options.local) {
    const localEnvPath = path.join(ROOT_DIR, 'apps/picsa-server/.env');
    if (fs.existsSync(localEnvPath)) {
      dotenv.config({ path: localEnvPath, override: true });
    }
  } else {
    const serverEnvPath = path.join(ROOT_DIR, 'apps/picsa-server/.env.server');
    const localOverridePath = path.join(ROOT_DIR, 'apps/picsa-server/.env.local');
    if (fs.existsSync(serverEnvPath)) {
      dotenv.config({ path: serverEnvPath, override: true });
    }
    if (fs.existsSync(localOverridePath)) {
      dotenv.config({ path: localOverridePath, override: false });
    }
  }

  let url: string | undefined;
  if (options.local) {
    url = process.env.SUPABASE_URL || 'http://localhost:54321';
  } else {
    const projectIdUrl = process.env.SUPABASE_PROJECT_ID
      ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
      : undefined;
    url = process.env.SUPABASE_REMOTE_URL || process.env.SUPABASE_URL || projectIdUrl;
  }

  const key = options.local
    ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    : process.env.SUPABASE_REMOTE_SECRET_KEY ||
      process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_REMOTE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_REMOTE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    const targetDesc = options.local ? 'local Supabase container' : 'remote Supabase project';
    const configHint = options.local
      ? 'Ensure apps/picsa-server/.env exists with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      : 'Ensure apps/picsa-server/.env.server exists with SUPABASE_REMOTE_URL and SUPABASE_REMOTE_SECRET_KEY, or pass --local to target the local dev container.';
    throw new Error(`Missing Supabase credentials for ${targetDesc}.\n${configHint}`);
  }

  console.log(`\n🔌 Connected to Supabase (${options.local ? 'LOCAL' : 'REMOTE'}): ${url}`);
  return createClient(url, key);
}

function toBundleRow(row: ForecastRow): IForecastBundleRow {
  // Strip volatile metadata (DB defaults repopulate on seed import) for diff-stable output
  const { created_at, updated_at, ...bundleRow } = row;
  return bundleRow;
}

/** Byte-wise id sort for output deterministic across machines and runs */
function byId(a: IForecastBundleRow, b: IForecastBundleRow): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

async function syncCountryBundle(client: SupabaseClient, country: string): Promise<void> {
  // Live rows only: tombstoned forecasts (storage_file null) must never re-seed clients
  const { data, error } = await client
    .from('forecasts')
    .select(BUNDLE_COLUMNS)
    .eq('country_code', country)
    .in('forecast_type', FORECAST_TYPES)
    .not('storage_file', 'is', null)
    .order('id', { ascending: true });

  if (error) {
    throw new Error(`[${country}] forecast pull failed: ${error.message}`);
  }

  const rows = ((data ?? []) as ForecastRow[]).map(toBundleRow).sort(byId);
  const bundle = {
    seasonal: rows.filter((row) => row.forecast_type === 'seasonal'),
    downscaled: rows.filter((row) => row.forecast_type === 'downscaled'),
  };

  const outPath = path.join(FORECASTS_DIR, `${country}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf-8');
  console.log(
    `  [${country}] seasonal: ${bundle.seasonal.length}, downscaled: ${bundle.downscaled.length} -> ${path.relative(ROOT_DIR, outPath)}`,
  );
  if (rows.length === 0) {
    console.log(`  [${country}] ⚠️  no live forecasts found - empty bundle written`);
  }
}

async function main(): Promise<void> {
  const args = parseCliArgs();
  const countries = args.country ? [args.country] : SUPPORTED_COUNTRIES;
  const unknown = countries.filter((country) => !SUPPORTED_COUNTRIES.includes(country));
  if (unknown.length > 0) {
    throw new Error(`Unsupported country: ${unknown.join(', ')} (expected one of ${SUPPORTED_COUNTRIES.join(', ')})`);
  }

  if (!fs.existsSync(FORECASTS_DIR)) {
    fs.mkdirSync(FORECASTS_DIR, { recursive: true });
  }

  console.log(`\nSyncing forecast bundles (${args.local ? 'LOCAL' : 'REMOTE'}): ${countries.join(', ')}`);
  const client = getBundleSupabaseClient({ local: args.local });
  for (const country of countries) {
    await syncCountryBundle(client, country);
  }
  console.log('\n✅ Forecast bundles synced');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

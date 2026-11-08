/**
 * Resources Bundle Sync
 *
 * Pulls resource collections, files, and links from Supabase and writes per-country
 * JSON bundles ({ collections, files, links }) into libs/data/resources/bundles.
 * Output is consumed by the app as offline fallback resource metadata.
 *
 * Volatile timestamps (created_at, modified_at, updated_at) are stripped for diff-stable
 * output, and rows are deterministically sorted by id.
 *
 * Usage:
 *   yarn scripts:resources:sync [--country=mw] [--local] [--audit-only]
 *
 * Args:
 *   --country=<code>    Only sync one country (mw, zm, zw, tj). Default: all countries
 *   --local             Pull from the local Supabase container instead of remote.
 *                       Default pulls remote via apps/picsa-server/.env.server
 *   --audit-only        Compute and report changes without writing files (alias: --dry-run)
 *   --env=<path>        Load environment variables from a custom env file
 *   --help, -h          Print usage and exit
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Database } from '@picsa/server-types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSyncSupabaseClient } from '../climate/sync-climate-data';

export type ICollectionRow = Database['public']['Tables']['resource_collections']['Row'];
export type IFileRow = Database['public']['Tables']['resource_files']['Row'];
export type ILinkRow = Database['public']['Tables']['resource_links']['Row'];

/** Bundled rows omit volatile timestamps so output is deterministic across runs */
export type IResourceCollectionBundleRow = Omit<ICollectionRow, 'created_at' | 'modified_at' | 'updated_at'>;
export type IResourceFileBundleRow = Omit<IFileRow, 'created_at' | 'modified_at' | 'updated_at'>;
export type IResourceLinkBundleRow = Omit<ILinkRow, 'created_at' | 'modified_at' | 'updated_at'>;

export interface IResourceCountryBundle {
  collections: IResourceCollectionBundleRow[];
  files: IResourceFileBundleRow[];
  links: IResourceLinkBundleRow[];
}

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const BUNDLES_DIR = path.join(ROOT_DIR, 'apps/picsa-tools/resources-tool/src/app/data/bundles');
const SUPPORTED_COUNTRIES = ['mw', 'zm', 'zw', 'tj'];

export interface CliArgs {
  country?: string;
  local?: boolean;
  auditOnly?: boolean;
  env?: string;
  help?: boolean;
}

export function parseCliArgs(argv = process.argv.slice(2)): CliArgs {
  const result: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--local') {
      result.local = true;
      continue;
    }
    if (arg === '--audit-only' || arg === '--dry-run') {
      result.auditOnly = true;
      continue;
    }
    const matchCountry = arg.match(/^--country[= ](.+)$/) ?? (arg === '--country' ? ['', argv[++i]] : null);
    if (matchCountry?.[1]) {
      result.country = matchCountry[1].toLowerCase();
      continue;
    }
    const matchEnv = arg.match(/^--env[= ](.+)$/) ?? (arg === '--env' ? ['', argv[++i]] : null);
    if (matchEnv?.[1]) {
      result.env = matchEnv[1];
      continue;
    }
  }
  return result;
}

export function printHelp(): void {
  console.log(`Resources Bundle Sync

Usage:
  yarn scripts:resources:sync [options]

Options:
  --country=<code>   Only sync one country (mw, zm, zw, tj). Default: all countries
  --local            Pull from the local Supabase container instead of remote
                     (default: apps/picsa-server/.env.server credentials)
  --audit-only       Compute and report changes without writing files (alias: --dry-run)
  --env=<path>       Load environment variables from a custom env file
  --help, -h         Show this help message
`);
}

function cleanCollectionRow(row: ICollectionRow): IResourceCollectionBundleRow {
  const { created_at, modified_at, updated_at, ...rest } = row;
  return rest;
}

function cleanFileRow(row: IFileRow): IResourceFileBundleRow {
  const { created_at, modified_at, updated_at, ...rest } = row;
  return rest;
}

function cleanLinkRow(row: ILinkRow): IResourceLinkBundleRow {
  const { created_at, modified_at, updated_at, ...rest } = row;
  return rest;
}

function byId<T extends { id: string }>(a: T, b: T): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export async function fetchCountryResources(client: SupabaseClient, country: string): Promise<IResourceCountryBundle> {
  const [collectionsRes, filesRes, linksRes] = await Promise.all([
    client.from('resource_collections').select('*').eq('country_code', country).order('id', { ascending: true }),
    client.from('resource_files').select('*').eq('country_code', country).order('id', { ascending: true }),
    client.from('resource_links').select('*').eq('country_code', country).order('id', { ascending: true }),
  ]);

  if (collectionsRes.error) {
    throw new Error(`[${country}] resource_collections pull failed: ${collectionsRes.error.message}`);
  }
  if (filesRes.error) {
    throw new Error(`[${country}] resource_files pull failed: ${filesRes.error.message}`);
  }
  if (linksRes.error) {
    throw new Error(`[${country}] resource_links pull failed: ${linksRes.error.message}`);
  }

  const collections = ((collectionsRes.data ?? []) as ICollectionRow[]).map(cleanCollectionRow).sort(byId);
  const files = ((filesRes.data ?? []) as IFileRow[]).map(cleanFileRow).sort(byId);
  const links = ((linksRes.data ?? []) as ILinkRow[]).map(cleanLinkRow).sort(byId);

  return { collections, files, links };
}

export async function syncCountryBundle(
  client: SupabaseClient,
  country: string,
  options: { auditOnly?: boolean } = {},
): Promise<{ country: string; collections: number; files: number; links: number; changed: boolean }> {
  const bundle = await fetchCountryResources(client, country);
  const outPath = path.join(BUNDLES_DIR, `${country}.json`);
  const newContent = `${JSON.stringify(bundle, null, 2)}\n`;

  let changed = true;
  if (fs.existsSync(outPath)) {
    const existingContent = fs.readFileSync(outPath, 'utf-8');
    changed = existingContent !== newContent;
  }

  if (!options.auditOnly && changed) {
    fs.writeFileSync(outPath, newContent, 'utf-8');
  }

  const action = options.auditOnly
    ? changed
      ? 'AUDIT (changes detected)'
      : 'AUDIT (up-to-date)'
    : changed
      ? 'UPDATED'
      : 'UNCHANGED';

  console.log(
    `  [${country}] ${action}: collections: ${bundle.collections.length}, files: ${bundle.files.length}, links: ${bundle.links.length} -> ${path.relative(ROOT_DIR, outPath)}`,
  );

  return {
    country,
    collections: bundle.collections.length,
    files: bundle.files.length,
    links: bundle.links.length,
    changed,
  };
}

export async function main(): Promise<void> {
  const args = parseCliArgs();
  if (args.help) {
    printHelp();
    return;
  }

  const countries = args.country ? [args.country] : SUPPORTED_COUNTRIES;
  const unknown = countries.filter((c) => !SUPPORTED_COUNTRIES.includes(c));
  if (unknown.length > 0) {
    throw new Error(`Unsupported country: ${unknown.join(', ')} (expected one of ${SUPPORTED_COUNTRIES.join(', ')})`);
  }

  if (!fs.existsSync(BUNDLES_DIR)) {
    fs.mkdirSync(BUNDLES_DIR, { recursive: true });
  }

  console.log(
    `\nSyncing resource bundles (${args.local ? 'LOCAL' : 'REMOTE'}${args.auditOnly ? ' [DRY RUN]' : ''}): ${countries.join(', ')}`,
  );
  const client = getSyncSupabaseClient({ local: args.local, env: args.env });

  for (const country of countries) {
    await syncCountryBundle(client, country, { auditOnly: args.auditOnly });
  }

  console.log('\n✅ Resource bundles synced successfully');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

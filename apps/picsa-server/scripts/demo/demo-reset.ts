/**
 * Reset the demo (`xx`) sandbox: database + storage files.
 *
 * Single scoped entry point for everything demo — there is intentionally no
 * `db:demo:*` family. All demo rows live in `demo-baseline.ts` (typed against
 * the schema) and are applied here with the same service_role supabase-js
 * clients the seed scripts use (`getLocalSupabaseClient` /
 * `getExportSupabaseClient`).
 *
 * Invoke:
 *   yarn nx run picsa-server:demo:reset [-- --remote] [--dry-run]
 *
 * Flags:
 *   (default)   Reset the LOCAL supabase container (via `supabase status` creds)
 *   --remote    Reset PROD (`.env.server` secret — operator only, confirmed
 *               interactively; never run from CI)
 *   --dry-run   Report what would be deleted/seeded, write nothing (no confirm)
 *
 * Safety (mirrors scripts/backup/backup.ts):
 * - Remote prod resets confirm via stdin (`reset demo on remote`) and refuse
 *   non-interactive shells unless `--dry-run` (so CI can never wipe prod).
 *   Local resets never prompt — local scratch data is routine and fully
 *   reversible via re-run (this is also what lets `db:seed` and
 *   `db:seed:extended` chain demo:reset non-interactively).
 * - Deletes are hardcoded to `country_code = 'xx'` (below) and bucket
 *   `xx/uploads/*` — no caller-supplied scope, nothing outside `xx`
 *   is ever touched. Grants (`user_roles`, `deployments` row) are upserted,
 *   never wiped, so facilitator access survives resets.
 *
 * What it does, in order:
 *   1. Ensure `xx/baseline/*` storage files exist (upload missing). Baseline
 *      paths are FK-referenced by demo DB rows, so this runs first.
 *   2. Delete `xx` content rows (child tables before parents), then insert
 *      the baseline (deployments upserted, user roles insert-only), then
 *      apply demo Chichewa onto shared translation rows (clearing `xx_ny`
 *      everywhere first so resets are deterministic).
 *   3. Wipe `xx/uploads/*` (workshop scratch). `xx/baseline/*` is never wiped.
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Blob } from 'buffer';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

import { getMimeType } from '@picsa/utils/mimetypes';

import { getExportSupabaseClient, getLocalSupabaseClient } from '../utils/supabase.utils';
import { DEMO_BASELINE } from './baseline';

const DEMO_BUCKET = 'xx';
const BASELINE_PREFIX = 'baseline';
const UPLOADS_PREFIX = 'uploads';

const SEED_STORAGE_XX_DIR = path.resolve(__dirname, '../../supabase/data/storage/xx');

type Target = 'local' | 'remote';

interface CliOptions {
  target: Target;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(argv = process.argv.slice(2)): CliOptions {
  const options: CliOptions = { target: 'local', dryRun: false, help: false };
  for (const arg of argv) {
    if (arg === '--remote') options.target = 'remote';
    else if (arg === '--dry-run' || arg === '--dryrun') options.dryRun = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else {
      console.error(`\n❌ Unknown flag: ${arg}\n`);
      printHelp();
      process.exit(1);
    }
  }
  return options;
}

function printHelp() {
  console.log(`demo:reset — reset the demo (xx) sandbox (database + storage)

Usage:
  yarn nx run picsa-server:demo:reset [-- --remote] [--dry-run]

  (default)  local container     --remote  prod (.env.server secret)
             --dry-run  report only, write nothing (no confirm needed)

Only --remote prompts for confirmation and refuses non-interactive shells.
Never run with --remote from CI.`);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

type AnyClient = any;

function getClient(target: Target): AnyClient {
  // Same clients the seed/export scripts use. Remote uses the .env.server
  // secret key (service_role equivalent) — the pull-only export path in
  // db-seed-export.ts must stay read-only; this reset path is separate.
  if (target === 'remote') return getExportSupabaseClient();
  return getLocalSupabaseClient();
}

/** Baseline tables in an order safe for both DELETE (child→parent) and INSERT (reversed). */
const BASELINE_TABLES = [
  'resource_files_child',
  'resource_files',
  'resource_links',
  'resource_collections',
  'crop_data_downscaled',
  'crop_data',
  'climate_station_data',
  'climate_stations',
  'forecasts',
  'translations',
] as const;

/** UUID columns validated up front so a typo fails before any rows are wiped. */
const UUID_COLUMNS: Record<string, string[]> = {
  user_roles: ['user_id'],
  resource_files: ['owner'],
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate the typed baseline up front so a typo fails before any rows are wiped. */
function loadBaseline(): Map<string, Record<string, any>[]> {
  const baseline = new Map<string, Record<string, any>[]>();
  const tables: Record<string, Record<string, any>[]> = {
    ...(DEMO_BASELINE as Record<string, Record<string, any>[]>),
  };
  for (const table of [...BASELINE_TABLES, 'deployments', 'user_roles', 'translation_seeds']) {
    const rows = tables[table] || [];
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(`Invalid baseline row in ${table}: expected an object`);
      }
      for (const col of UUID_COLUMNS[table] || []) {
        if (row[col] && !UUID_RE.test(row[col])) {
          throw new Error(`Invalid baseline UUID in ${table}.${col}: ${row[col]}`);
        }
      }
    }
    baseline.set(table, rows);
  }
  return baseline;
}

/** Columns holding `<bucket>/<path>` storage references (nulled when the object is missing). */
const STORAGE_REF_COLUMNS: Record<string, string[]> = {
  deployments: ['icon_path'],
  resource_files: ['storage_file', 'cover_image'],
  resource_links: ['cover_image'],
  resource_collections: ['cover_image'],
};

/** Null out storage references with no matching storage_objects row (e.g. bare test DBs). */
async function resolveStorageRefs(client: AnyClient, table: string, rows: Record<string, any>[]) {
  const columns = STORAGE_REF_COLUMNS[table] || [];
  if (columns.length === 0 || rows.length === 0) return rows;
  const wanted = new Set<string>();
  for (const row of rows) for (const col of columns) if (row[col]) wanted.add(row[col]);
  if (wanted.size === 0) return rows;
  const { data, error } = await client
    .schema('public')
    .from('storage_objects')
    .select('path')
    .in('path', [...wanted]);
  if (error) throw error;
  const existing = new Set((data || []).map((r: any) => r.path));
  return rows.map((row) => {
    const copy = { ...row };
    for (const col of columns) if (copy[col] && !existing.has(copy[col])) copy[col] = null;
    return copy;
  });
}

async function countXxRows(client: AnyClient, table: string): Promise<number> {
  const { count, error } = await client
    .schema('public')
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('country_code', 'xx');
  if (error) throw error;
  return count ?? 0;
}

/** Recursively list every file path under a bucket prefix (paths relative to bucket). */
async function listAllFiles(client: AnyClient, prefix: string): Promise<string[]> {
  const files: string[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await client.storage.from(DEMO_BUCKET).list(prefix || undefined, { limit: 100, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders list children; files list empty. Probe to distinguish.
      const { data: children } = await client.storage.from(DEMO_BUCKET).list(full, { limit: 1 });
      if (children && children.length > 0) {
        files.push(...(await listAllFiles(client, full)));
      } else {
        files.push(full);
      }
    }
    if (data.length < 100) break;
    offset += 100;
  }
  return files;
}

async function ensureBaselineFiles(client: AnyClient, dryRun: boolean) {
  const entries = globSync('**', { stat: false, withFileTypes: true, cwd: SEED_STORAGE_XX_DIR }).filter((g) =>
    g.isFile(),
  );
  const relPaths = entries.map((e) => (e as any).relativePosix() as string);
  if (dryRun) {
    console.log(`\n[storage] dry-run: would ensure ${relPaths.length} baseline file(s) under ${DEMO_BUCKET}/`);
    for (const rel of relPaths) console.log(`   = ${DEMO_BUCKET}/${rel}`);
    return;
  }
  let uploaded = 0;
  for (const rel of relPaths) {
    const localPath = path.join(SEED_STORAGE_XX_DIR, rel);
    const type = getMimeType(rel);
    if (!type) throw new Error(`Failed to lookup content type: ${localPath}`);
    const fileBlob = new Blob([readFileSync(localPath)], { type });
    const { error } = await client.storage.from(DEMO_BUCKET).upload(rel, fileBlob, { upsert: true });
    if (error) {
      console.error(`[storage] upload failed: ${DEMO_BUCKET}/${rel}`, error);
      process.exit(1);
    }
    uploaded++;
  }
  console.log(`\n[storage] baseline ensured: ${uploaded} file(s) under ${DEMO_BUCKET}/`);
}

async function wipeUploads(client: AnyClient, dryRun: boolean) {
  const files = await listAllFiles(client, UPLOADS_PREFIX);
  if (files.length === 0) {
    console.log(`[storage] uploads clean: nothing under ${DEMO_BUCKET}/${UPLOADS_PREFIX}/`);
    return;
  }
  if (dryRun) {
    console.log(`\n[storage] dry-run: would delete ${files.length} file(s) under ${DEMO_BUCKET}/${UPLOADS_PREFIX}/`);
    for (const f of files.slice(0, 20)) console.log(`   - ${DEMO_BUCKET}/${f}`);
    if (files.length > 20) console.log(`   ... and ${files.length - 20} more`);
    return;
  }
  // Remove in chunks (API limit per call).
  for (let i = 0; i < files.length; i += 100) {
    const { error } = await client.storage.from(DEMO_BUCKET).remove(files.slice(i, i + 100));
    if (error) {
      console.error(`[storage] remove failed under ${DEMO_BUCKET}/${UPLOADS_PREFIX}/`, error);
      process.exit(1);
    }
  }
  console.log(`[storage] uploads wiped: ${files.length} file(s) removed from ${DEMO_BUCKET}/${UPLOADS_PREFIX}/`);
}

/** Delete `xx` content rows (deployments/user_roles are preserved, not wiped). */
async function deleteDemoRows(client: AnyClient) {
  for (const table of BASELINE_TABLES) {
    const { error } = await client.schema('public').from(table).delete().eq('country_code', 'xx');
    if (error) throw error;
  }
}

/** Apply demo Chichewa to shared translation rows (no xx duplicates).
 * Clears xx_ny everywhere first so resets are deterministic, then sets the
 * seeded values on rows that exist. Missing ids are warned and skipped (e.g.
 * prod text changed and an id rotated) — never fatal. */
async function applyTranslationSeeds(
  client: AnyClient,
  seeds: Record<string, any>[],
  dryRun: boolean,
): Promise<{ cleared: number; applied: number; missing: string[]; would_apply?: number }> {
  const ids = seeds.map((s) => s.id);
  const { data: existing, error: selError } = await client
    .schema('public')
    .from('translations')
    .select('id')
    .in('id', ids);
  if (selError) throw selError;
  const found = new Set(((existing || []) as any[]).map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) {
    console.warn(`[db] translation seeds missing from target DB (skipped): ${missing.join(', ')}`);
  }
  if (dryRun) {
    const { count } = await client
      .schema('public')
      .from('translations')
      .select('*', { count: 'exact', head: true })
      .not('xx_ny', 'is', null);
    return { cleared: 0, applied: 0, missing, would_apply: seeds.length - missing.length };
  }
  let cleared = 0;
  {
    const { error, count } = await client
      .schema('public')
      .from('translations')
      .update({ xx_ny: null }, { count: 'exact' })
      .not('xx_ny', 'is', null);
    if (error) throw error;
    cleared = count ?? 0;
  }
  let applied = 0;
  for (const seed of seeds) {
    if (!found.has(seed.id)) continue;
    const { error } = await client
      .schema('public')
      .from('translations')
      .update({ xx_ny: seed.xx_ny })
      .eq('id', seed.id);
    if (error) throw error;
    applied++;
  }
  return { cleared, applied, missing };
}

/** Insert the JSON baseline (deployments upserted, user roles insert-only). */
async function insertBaseline(client: AnyClient, baseline: Map<string, Record<string, any>[]>) {
  const inserted: Record<string, number> = {};
  // Demo deployment first (user_roles FK references it).
  const deployments = await resolveStorageRefs(client, 'deployments', baseline.get('deployments') || []);
  if (deployments.length > 0) {
    const { error } = await client.schema('public').from('deployments').upsert(deployments);
    if (error) throw error;
    inserted['deployments'] = deployments.length;
  }
  // Dev access: insert-only (never clobber facilitator grants); skip users
  // missing from auth.users (FK) — e.g. bare test DBs.
  const roles = baseline.get('user_roles') || [];
  let granted = 0;
  for (const row of roles) {
    const { error } = await client.schema('public').from('user_roles').insert(row);
    if (error) {
      // 23505 duplicate (already granted) or 23503 FK (unknown user) — both safe to skip.
      if ((error as any).code === '23505' || (error as any).code === '23503') continue;
      throw error;
    }
    granted++;
  }
  inserted['user_roles'] = granted;
  // Content tables, parents before children (reverse of delete order).
  // `translation_seeds` is not a table — applied separately below.
  const contentTables = [...BASELINE_TABLES].reverse().filter((t) => t !== 'translations');
  // Forecast ids carry a YYYYMM prefix the dashboard filters on; stamp with
  // the reset month so the seeded row is visible without any API sync.
  const yyyymm = new Date().toISOString().slice(0, 7).replace('-', '');
  for (const table of contentTables) {
    let rows = baseline.get(table) || [];
    if (table === 'forecasts') {
      rows = rows.map((r) => ({ ...r, id: String(r.id).replace(/^[^/]+/, yyyymm) }));
    }
    rows = await resolveStorageRefs(client, table, rows);
    if (rows.length === 0) continue;
    const { error } = await client.schema('public').from(table).insert(rows);
    if (error) throw error;
    inserted[table] = rows.length;
  }
  const seeds = await applyTranslationSeeds(client, baseline.get('translation_seeds') || [], false);
  inserted['translation_seeds'] = seeds.applied;
  return inserted;
}

async function resetDemo(options: CliOptions) {
  const { target, dryRun } = options;
  console.log(`\n🧪 demo:reset → target: ${target}${dryRun ? ' (dry-run)' : ''}`);

  if (!dryRun && target === 'remote') {
    if (!process.stdin.isTTY) {
      console.error('\n❌ Refusing prod reset without an interactive shell (use --dry-run for CI/non-interactive).\n');
      process.exit(1);
    }
    const expected = `reset demo on remote`;
    const answer = await prompt(`Type "${expected}" to confirm: `);
    if (answer.trim() !== expected) {
      console.error('\n❌ Confirmation mismatch — aborting, nothing changed.\n');
      process.exit(1);
    }
  }

  const client = getClient(target);

  // Load + validate the entire baseline before touching anything: a malformed
  // file must fail here, never after rows have been wiped.
  const baseline = loadBaseline();

  // 1. Baseline files first: demo DB rows FK-reference xx/baseline/* paths.
  await ensureBaselineFiles(client, dryRun);

  // 2. Database reset (scoped to xx; grants preserved).
  console.log(`\n[db] resetting demo rows on ${target}...`);
  if (dryRun) {
    const would_delete: Record<string, number> = {};
    for (const table of BASELINE_TABLES) would_delete[table] = await countXxRows(client, table);
    const would_insert: Record<string, number> = {};
    for (const [table, rows] of baseline) {
      if (table === 'translation_seeds' || rows.length === 0) continue;
      would_insert[table] = rows.length;
    }
    const seeds = await applyTranslationSeeds(client, baseline.get('translation_seeds') || [], true);
    console.log('[db] dry-run result:');
    console.log(JSON.stringify({ dry_run: true, would_delete, would_insert, translation_seeds: seeds }, null, 2));
  } else {
    await deleteDemoRows(client);
    const inserted = await insertBaseline(client, baseline);
    console.log('[db] reset result:');
    console.log(JSON.stringify({ dry_run: false, inserted }, null, 2));
  }

  // 3. Wipe workshop scratch (baseline/ untouched).
  await wipeUploads(client, dryRun);

  console.log(`\n✅ demo:reset complete (${target}${dryRun ? ', dry-run — nothing written' : ''}).`);
}

if (require.main === module) {
  const options = parseArgs();
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  if (!fs.existsSync(SEED_STORAGE_XX_DIR)) {
    console.error(`\n❌ Demo storage seed dir missing: ${SEED_STORAGE_XX_DIR}\n`);
    process.exit(1);
  }
  void resetDemo(options).catch((err) => {
    console.error('❌ demo:reset failed:', err?.message || err);
    process.exit(1);
  });
}

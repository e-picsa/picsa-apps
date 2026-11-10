/**
 * Resources Bundle Sync
 *
 * Pulls resource collections, files, and links from Supabase and writes per-country
 * JSON bundles ({ collections, files, links }) into apps/picsa-tools/resources-tool/src/app/data/bundles.
 * Output is consumed by the app as offline fallback resource metadata.
 *
 * Normalizes referenced cover image paths directly to their offline bundled asset paths:
 *   e.g. 'mw/resources/covers/Cover Image.png' -> 'assets/resources/covers/mw/Cover Image.webp'
 *
 * Also synchronizes and compresses referenced cover images into:
 *   apps/picsa-tools/resources-tool/src/assets/resources/covers/
 * Global covers live at the root, while country covers live under <country>/.
 * Existing files are cached to prevent re-compressing unchanged files.
 *
 * Direct Invocation:
 *   yarn scripts:resources:sync [options]
 *   or:
 *   npx ts-node -P apps/picsa-scripts/tsconfig.app.json -r tsconfig-paths/register apps/picsa-scripts/src/resources/sync-resources.ts [options]
 *
 * Options:
 *   --country=<code>    Only sync one country (mw, zm, zw, tj). Default: all countries
 *   --local             Pull from local Supabase container (http://localhost:54321).
 *                       Default pulls remote production via apps/picsa-server/.env.server
 *   --audit-only        Dry run: compute and report changes without writing files (alias: --dry-run)
 *   --skip-covers       Skip cover image synchronization
 *   --force-covers      Re-download and re-compress covers even if cached
 *   --env=<path>        Load environment variables from a custom env file
 *   --help, -h          Print usage and exit
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
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
export const COVERS_DIR = path.join(ROOT_DIR, 'apps/picsa-tools/resources-tool/src/assets/resources/covers');
export const COVER_CACHE_FILE = path.join(ROOT_DIR, 'apps/picsa-scripts/.cache/resources-covers.json');
const SUPPORTED_COUNTRIES = ['mw', 'zm', 'zw', 'tj'];

export interface ICoverCacheEntry {
  etag?: string;
  remoteSize?: number;
  updatedAt?: string;
  localSize: number;
  compressedAt: string;
}

export interface ICoverCacheManifest {
  version: 1;
  covers: Record<string, ICoverCacheEntry>;
}

export interface CliArgs {
  country?: string;
  local?: boolean;
  auditOnly?: boolean;
  skipCovers?: boolean;
  forceCovers?: boolean;
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
    if (arg === '--skip-covers') {
      result.skipCovers = true;
      continue;
    }
    if (arg === '--force-covers') {
      result.forceCovers = true;
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
  or:
  npx ts-node -P apps/picsa-scripts/tsconfig.app.json -r tsconfig-paths/register apps/picsa-scripts/src/resources/sync-resources.ts [options]

Options:
  --country=<code>   Only sync one country (mw, zm, zw, tj). Default: all countries
  --local            Pull from the local Supabase container instead of remote
                     (default: apps/picsa-server/.env.server credentials)
  --audit-only       Compute and report changes without writing files (alias: --dry-run)
  --skip-covers      Skip cover image sync
  --force-covers     Force re-download and re-compression of covers even if cached
  --env=<path>       Load environment variables from a custom env file
  --help, -h         Show this help message
`);
}

/**
 * Maps a Supabase storage cover_image path to its bundled offline asset path
 * (e.g. 'mw/resources/covers/Cover Image.png' -> 'assets/resources/covers/mw/Cover Image.webp')
 */
export function getBundledAssetCoverPath(storagePath?: string | null): string | null {
  if (!storagePath) return null;
  const clean = storagePath.trim();
  if (!clean || clean === 'global/images/placeholder.svg' || clean === 'placeholder.svg') {
    return null;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('assets/')) {
    return clean;
  }
  const filename = path.basename(clean);
  const optimized = getOptimizedFilename(filename);

  if (clean.startsWith('global/resources/covers/')) {
    return `assets/resources/covers/${optimized}`;
  }
  const countryMatch = clean.match(/^([a-z]{2})\/resources\/covers\/(.+)$/);
  if (countryMatch) {
    return `assets/resources/covers/${countryMatch[1]}/${optimized}`;
  }
  return clean;
}

function cleanCollectionRow(row: ICollectionRow): IResourceCollectionBundleRow {
  const { created_at, modified_at, updated_at, ...rest } = row;
  return {
    ...rest,
    cover_image: getBundledAssetCoverPath(row.cover_image),
  };
}

function cleanFileRow(row: IFileRow): IResourceFileBundleRow {
  const { created_at, modified_at, updated_at, ...rest } = row;
  return {
    ...rest,
    cover_image: getBundledAssetCoverPath(row.cover_image),
  };
}

function cleanLinkRow(row: ILinkRow): IResourceLinkBundleRow {
  const { created_at, modified_at, updated_at, ...rest } = row;
  return {
    ...rest,
    cover_image: getBundledAssetCoverPath(row.cover_image),
  };
}

function byId<T extends { id: string }>(a: T, b: T): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export interface IFetchedCountryResources {
  bundle: IResourceCountryBundle;
  storageCovers: string[];
}

export async function fetchCountryResources(
  client: SupabaseClient,
  country: string,
): Promise<IFetchedCountryResources> {
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

  const rawCollections = (collectionsRes.data ?? []) as ICollectionRow[];
  const rawFiles = (filesRes.data ?? []) as IFileRow[];
  const rawLinks = (linksRes.data ?? []) as ILinkRow[];

  const storageCovers: string[] = [];
  const add = (c?: string | null) => {
    if (c && typeof c === 'string') {
      const clean = c.trim();
      if (clean && !clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('assets/')) {
        storageCovers.push(clean);
      }
    }
  };
  for (const c of rawCollections) add(c.cover_image);
  for (const f of rawFiles) add(f.cover_image);
  for (const l of rawLinks) add(l.cover_image);

  const collections = rawCollections.map(cleanCollectionRow).sort(byId);
  const files = rawFiles.map(cleanFileRow).sort(byId);
  const links = rawLinks.map(cleanLinkRow).sort(byId);

  return {
    bundle: { collections, files, links },
    storageCovers,
  };
}

export function extractReferencedCovers(bundles: IResourceCountryBundle[]): string[] {
  const set = new Set<string>();
  const add = (c?: string | null) => {
    if (c && typeof c === 'string') {
      const clean = c.trim();
      if (clean && !clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('assets/')) {
        set.add(clean);
      }
    }
  };

  for (const b of bundles) {
    for (const c of b.collections) add(c.cover_image);
    for (const f of b.files) add(f.cover_image);
    for (const l of b.links) add(l.cover_image);
  }
  return [...set].sort();
}

export function getOptimizedFilename(originalFilename: string): string {
  if (originalFilename.toLowerCase().endsWith('.svg')) return originalFilename;
  return originalFilename.replace(/\.(png|jpe?g|webp)$/i, '.webp');
}

export function getLocalCoverPath(storagePath: string): string {
  const filename = path.basename(storagePath);
  const optimized = getOptimizedFilename(filename);

  // Global covers: 'global/resources/covers/<file>' -> '<COVERS_DIR>/<optimized.webp>'
  if (storagePath.startsWith('global/resources/covers/')) {
    return path.join(COVERS_DIR, optimized);
  }
  // Country covers: '<country>/resources/covers/<file>' -> '<COVERS_DIR>/<country>/<optimized.webp>'
  const countryMatch = storagePath.match(/^([a-z]{2})\/resources\/covers\/(.+)$/);
  if (countryMatch) {
    return path.join(COVERS_DIR, countryMatch[1], optimized);
  }
  return path.join(COVERS_DIR, optimized);
}

export function loadCoverCache(): ICoverCacheManifest {
  if (!fs.existsSync(COVER_CACHE_FILE)) {
    return { version: 1, covers: {} };
  }
  try {
    const raw = fs.readFileSync(COVER_CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.version === 1 && parsed.covers) return parsed;
  } catch (err) {
    console.warn(`  ⚠️  Ignoring invalid cover cache: ${String(err)}`);
  }
  return { version: 1, covers: {} };
}

export function saveCoverCache(cache: ICoverCacheManifest): void {
  const dir = path.dirname(COVER_CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(COVER_CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, 'utf-8');
}

/**
 * Optimizes a raster cover image to max 300px dimension and converts to WebP with 80% quality
 */
export async function optimizeCoverBuffer(buffer: Buffer, filename: string): Promise<Buffer> {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.svg') {
    return buffer; // SVGs are already vector / compact
  }

  return sharp(buffer)
    .resize(300, 300, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Syncs referenced cover images from Supabase Storage into offline assets.
 * Checks cache to avoid re-compressing unchanged files.
 */
export async function syncReferencedCovers(
  client: SupabaseClient,
  storagePaths: string[],
  options: { auditOnly?: boolean; force?: boolean } = {},
): Promise<{ total: number; cached: number; synced: number; originalBytes: number; compressedBytes: number }> {
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }

  const cache = loadCoverCache();
  let cachedCount = 0;
  let syncedCount = 0;
  let originalBytes = 0;
  let compressedBytes = 0;

  // Group paths by bucket for efficient batch list
  const byBucket = new Map<string, string[]>();
  for (const sp of storagePaths) {
    const [bucket] = sp.split('/');
    const list = byBucket.get(bucket) ?? [];
    list.push(sp);
    byBucket.set(bucket, list);
  }

  // Pre-fetch remote metadata per bucket
  const remoteMetaMap = new Map<string, { size?: number; etag?: string; updatedAt?: string }>();
  for (const bucket of byBucket.keys()) {
    const { data } = await client.storage.from(bucket).list('resources/covers', { limit: 200 });
    for (const obj of data ?? []) {
      const fullPath = `${bucket}/resources/covers/${obj.name}`;
      remoteMetaMap.set(fullPath, {
        size: obj.metadata?.size,
        etag: obj.metadata?.eTag,
        updatedAt: obj.updated_at,
      });
    }
  }

  for (const sp of storagePaths) {
    const localDest = getLocalCoverPath(sp);
    const destDir = path.dirname(localDest);
    const filename = path.basename(localDest);
    const [bucket, ...pathParts] = sp.split('/');
    const objectPath = pathParts.join('/');

    const remoteMeta = remoteMetaMap.get(sp);
    const cachedEntry = cache.covers[sp];
    const fileExistsLocally = fs.existsSync(localDest);
    const isSvg = filename.toLowerCase().endsWith('.svg');

    // Existing vector SVGs should never be overwritten unless forced
    if (isSvg && fileExistsLocally && !options.force) {
      cachedCount++;
      continue;
    }

    // Check if we can reuse existing file without re-downloading/re-compressing.
    // If the file already exists locally in the repository, do not re-compress unless forced
    // or remote metadata confirms the source object in Supabase has changed.
    const isFresh =
      !options.force &&
      fileExistsLocally &&
      (cachedEntry
        ? !remoteMeta ||
          (remoteMeta.size != null && cachedEntry.remoteSize === remoteMeta.size) ||
          (remoteMeta.etag != null && cachedEntry.etag === remoteMeta.etag)
        : true);

    if (isFresh) {
      if (!cachedEntry) {
        // Seed cache from existing local file
        const stat = fs.statSync(localDest);
        cache.covers[sp] = {
          etag: remoteMeta?.etag,
          remoteSize: remoteMeta?.size,
          updatedAt: remoteMeta?.updatedAt,
          localSize: stat.size,
          compressedAt: new Date(stat.mtimeMs).toISOString(),
        };
      }
      cachedCount++;
      continue;
    }

    if (options.auditOnly) {
      syncedCount++;
      console.log(`  [cover:audit] Needs sync: ${sp} -> ${path.relative(ROOT_DIR, localDest)}`);
      continue;
    }

    // Download file from Supabase storage
    const { data: blob, error } = await client.storage.from(bucket).download(objectPath);
    if (error || !blob) {
      console.warn(`  ⚠️  Failed to download cover ${sp}: ${error?.message ?? 'no data'}`);
      continue;
    }

    const rawBuffer = Buffer.from(await blob.arrayBuffer());
    originalBytes += rawBuffer.byteLength;

    const optimizedBuffer = await optimizeCoverBuffer(rawBuffer, filename);
    compressedBytes += optimizedBuffer.byteLength;

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.writeFileSync(localDest, optimizedBuffer);

    // Clean up old uncompressed non-webp file if it exists alongside the new .webp file
    const oldLocalPath = path.join(destDir, path.basename(objectPath));
    if (oldLocalPath !== localDest && fs.existsSync(oldLocalPath)) {
      fs.unlinkSync(oldLocalPath);
    }

    cache.covers[sp] = {
      etag: remoteMeta?.etag,
      remoteSize: remoteMeta?.size ?? rawBuffer.byteLength,
      updatedAt: remoteMeta?.updatedAt,
      localSize: optimizedBuffer.byteLength,
      compressedAt: new Date().toISOString(),
    };
    syncedCount++;

    const ratio =
      rawBuffer.byteLength > 0
        ? `(-${Math.round((1 - optimizedBuffer.byteLength / rawBuffer.byteLength) * 100)}%)`
        : '';
    console.log(
      `  [cover:sync] ${sp} (${formatBytes(rawBuffer.byteLength)} -> ${formatBytes(optimizedBuffer.byteLength)} ${ratio}) -> ${path.relative(ROOT_DIR, localDest)}`,
    );
  }

  if (!options.auditOnly) {
    saveCoverCache(cache);
  }

  return {
    total: storagePaths.length,
    cached: cachedCount,
    synced: syncedCount,
    originalBytes,
    compressedBytes,
  };
}

export async function syncCountryBundle(
  client: SupabaseClient,
  country: string,
  options: { auditOnly?: boolean } = {},
): Promise<{ country: string; bundle: IResourceCountryBundle; storageCovers: string[]; changed: boolean }> {
  const { bundle, storageCovers } = await fetchCountryResources(client, country);
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
    bundle,
    storageCovers,
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

  const bundles: IResourceCountryBundle[] = [];
  const allStorageCovers = new Set<string>();
  for (const country of countries) {
    const res = await syncCountryBundle(client, country, { auditOnly: args.auditOnly });
    bundles.push(res.bundle);
    for (const sc of res.storageCovers) allStorageCovers.add(sc);
  }

  // Cover image synchronization
  if (!args.skipCovers) {
    const covers = [...allStorageCovers].sort();
    console.log(`\n🖼️  Synchronizing ${covers.length} referenced cover images...`);
    const coverStats = await syncReferencedCovers(client, covers, {
      auditOnly: args.auditOnly,
      force: args.forceCovers,
    });
    console.log(
      `   Covers summary: ${coverStats.total} referenced (${coverStats.cached} cached/up-to-date, ${coverStats.synced} processed)`,
    );
    if (coverStats.originalBytes > 0) {
      console.log(
        `   Size reduction: ${formatBytes(coverStats.originalBytes)} -> ${formatBytes(coverStats.compressedBytes)} (-${Math.round((1 - coverStats.compressedBytes / coverStats.originalBytes) * 100)}%)`,
      );
    }
  }

  console.log('\n✅ Resource bundles synced successfully');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

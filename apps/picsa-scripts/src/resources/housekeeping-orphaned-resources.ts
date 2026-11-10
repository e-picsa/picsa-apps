/**
 * Housekeeping Script for Orphaned Resources
 *
 * Scans Supabase Storage buckets (global, mw, zm, zw, tj) under `resources/` and
 * `resources/covers/` and cross-references against active database rows in:
 *   - resource_files (storage_file, cover_image)
 *   - resource_files_child (storage_file, cover_image)
 *   - resource_collections (cover_image)
 *   - resource_links (cover_image)
 *
 * Detects:
 *   1. Orphaned cover images (duplicates, superseded uploads, remnants of deleted resources)
 *   2. Orphaned document/PDF files (remnants of deleted resources)
 *
 * Direct Invocation:
 *   yarn scripts:resources:housekeeping [options]
 *   or:
 *   npx ts-node -P apps/picsa-scripts/tsconfig.app.json -r tsconfig-paths/register apps/picsa-scripts/src/resources/housekeeping-orphaned-resources.ts [options]
 *
 * Options:
 *   --dry-run       Audit and report orphaned files without deleting (DEFAULT)
 *   --execute       Execute actual deletion of orphaned files from Supabase Storage
 *   --local         Target local Supabase container (default: remote via apps/picsa-server/.env.server)
 *   --country=<code> Filter audit to a specific country bucket (mw, zm, zw, tj, global)
 *   --env=<path>    Custom env file path
 *   --help, -h      Print help
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSyncSupabaseClient } from '../climate/sync-climate-data';

export interface IOrphanedFile {
  bucket: string;
  folder: string;
  name: string;
  fullPath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt?: string;
  updatedAt?: string;
  etag?: string;
  mimetype?: string;
  classification: 'duplicate' | 'superseded' | 'legacy_remnant' | 'unreferenced';
  notes: string;
}

export interface IHousekeepingAuditResult {
  totalScanned: number;
  totalActiveReferenced: number;
  orphanedCovers: IOrphanedFile[];
  orphanedDocuments: IOrphanedFile[];
  totalOrphanedBytes: number;
  totalOrphanedFormatted: string;
}

const SUPPORTED_BUCKETS = ['global', 'mw', 'zm', 'zw', 'tj'];

/**
 * Generic global icons and logos that should always be retained as shared global assets,
 * even if not referenced by active resources currently.
 */
export const PROTECTED_GLOBAL_COVERS = new Set([
  'global/resources/covers/apps.png',
  'global/resources/covers/daily-forecast.png',
  'global/resources/covers/document.svg',
  'global/resources/covers/gender-equality.svg',
  'global/resources/covers/gender-equality-1.svg',
  'global/resources/covers/placeholder.svg',
  'global/resources/covers/spreadsheet.svg',
  'global/resources/covers/videos.svg',
  'global/resources/covers/weather.svg',
  'global/resources/covers/workshops.png',
  'global/resources/covers/facebook.svg',
  'global/resources/covers/whatsapp.svg',
  'global/resources/covers/twitter.png',
  'global/resources/covers/access-ag.jpg',
  'global/resources/covers/daes_v2.webp',
  'global/resources/covers/dccms.jpg',
  'global/resources/covers/gras-nelk.jpg',
  'global/resources/covers/meteoblue.jpg',
  'global/resources/covers/mlimi.webp',
  'global/resources/covers/plantix.webp',
  'global/resources/covers/plantwise.webp',
  'global/resources/covers/wmo.png',
  'global/resources/covers/zaulimi.webp',
]);

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export interface HousekeepingCliArgs {
  execute?: boolean;
  local?: boolean;
  country?: string;
  env?: string;
  help?: boolean;
}

export function parseCliArgs(argv = process.argv.slice(2)): HousekeepingCliArgs {
  const result: HousekeepingCliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--execute') {
      result.execute = true;
      continue;
    }
    if (arg === '--dry-run') {
      result.execute = false;
      continue;
    }
    if (arg === '--local') {
      result.local = true;
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
  console.log(`Resources Storage Housekeeping

Audits and cleans up orphaned covers and documents in Supabase Storage.

Usage:
  yarn scripts:resources:housekeeping [options]

Options:
  --dry-run          Report orphaned files without deleting them (DEFAULT)
  --execute          Permanently remove orphaned files from Supabase Storage
  --local            Target local Supabase container instead of remote
  --country=<code>   Filter to a specific bucket (global, mw, zm, zw, tj)
  --env=<path>       Load environment variables from a custom env file
  --help, -h         Show this message
`);
}

/**
 * Gather all referenced storage paths from public tables:
 * resource_files, resource_files_child, resource_collections, resource_links
 */
export async function fetchActiveResourceStorageReferences(client: SupabaseClient): Promise<Set<string>> {
  const referenced = new Set<string>();

  const [filesRes, childRes, collectionsRes, linksRes] = await Promise.all([
    client.from('resource_files').select('storage_file, cover_image'),
    client.from('resource_files_child').select('storage_file, cover_image'),
    client.from('resource_collections').select('cover_image'),
    client.from('resource_links').select('cover_image'),
  ]);

  if (filesRes.error) throw new Error(`resource_files query failed: ${filesRes.error.message}`);
  if (childRes.error) throw new Error(`resource_files_child query failed: ${childRes.error.message}`);
  if (collectionsRes.error) throw new Error(`resource_collections query failed: ${collectionsRes.error.message}`);
  if (linksRes.error) throw new Error(`resource_links query failed: ${linksRes.error.message}`);

  const add = (val?: string | null) => {
    if (val && typeof val === 'string') {
      const clean = val.trim();
      if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
        referenced.add(clean);
      }
    }
  };

  for (const row of filesRes.data ?? []) {
    add(row.storage_file);
    add(row.cover_image);
  }
  for (const row of childRes.data ?? []) {
    add(row.storage_file);
    add(row.cover_image);
  }
  for (const row of collectionsRes.data ?? []) {
    add(row.cover_image);
  }
  for (const row of linksRes.data ?? []) {
    add(row.cover_image);
  }

  return referenced;
}

/**
 * Scan a specific folder within a storage bucket via Supabase Storage API
 */
export async function listStorageObjectsInFolder(
  client: SupabaseClient,
  bucket: string,
  folder: string,
): Promise<Array<{ name: string; id: string; created_at: string; updated_at: string; metadata?: any }>> {
  const allObjects: Array<{ name: string; id: string; created_at: string; updated_at: string; metadata?: any }> = [];
  const PAGE_SIZE = 500;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client.storage.from(bucket).list(folder, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error || !data || data.length === 0) {
      break;
    }
    allObjects.push(...data);
    if (data.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      offset += PAGE_SIZE;
    }
  }
  return allObjects;
}

/**
 * Audit storage buckets against active DB references
 */
export async function auditOrphanedResources(
  client: SupabaseClient,
  options: { buckets?: string[] } = {},
): Promise<IHousekeepingAuditResult> {
  const activeReferences = await fetchActiveResourceStorageReferences(client);
  const bucketsToScan = options.buckets ?? SUPPORTED_BUCKETS;

  const orphanedCovers: IOrphanedFile[] = [];
  const orphanedDocuments: IOrphanedFile[] = [];
  let totalScanned = 0;
  let totalOrphanedBytes = 0;

  for (const bucket of bucketsToScan) {
    // 1. Scan resources/covers
    const coverObjects = await listStorageObjectsInFolder(client, bucket, 'resources/covers');
    for (const obj of coverObjects) {
      if (!obj.name || obj.name === '.emptyFolderPlaceholder') continue;
      totalScanned++;
      const fullPath = `${bucket}/resources/covers/${obj.name}`;

      if (PROTECTED_GLOBAL_COVERS.has(fullPath)) {
        continue;
      }

      if (!activeReferences.has(fullPath)) {
        const sizeBytes = Number(obj.metadata?.size ?? 0);
        totalOrphanedBytes += sizeBytes;

        let classification: IOrphanedFile['classification'] = 'unreferenced';
        let notes = 'Unreferenced in database';

        // Known heuristics for orphaned covers:
        if (bucket === 'zw' && (obj.name === 'Image.jpg' || obj.name === 'ness.jpg')) {
          classification = 'duplicate';
          notes = 'Byte-identical duplicate of SHEP Image.jpg';
        } else if (bucket === 'zm' && (obj.name === 'PICTO.png' || obj.name === 'download.png')) {
          classification = 'duplicate';
          notes = 'Byte-identical duplicate from deleted weather advisory';
        } else if (bucket === 'mw' && obj.name === 'PICTURE OF GUIDE TO MAIZE PRODUCTION.png') {
          classification = 'superseded';
          notes = '1.26MB uncompressed upload superseded seconds later by Cover Image.jpg';
        } else if (bucket === 'zm' && obj.name === 'Screenshot (32).png') {
          classification = 'superseded';
          notes = 'Superseded upload / duplicate of monitoring cover image';
        } else if (bucket === 'global' && (obj.name === 'picsa-field-manual.jpg' || obj.name === 'ram-refresher.jpg')) {
          classification = 'legacy_remnant';
          notes = 'Legacy manual / refresher video cover unreferenced in DB';
        } else {
          classification = 'legacy_remnant';
          notes = 'Remnant of deleted resource upload';
        }

        orphanedCovers.push({
          bucket,
          folder: 'resources/covers',
          name: obj.name,
          fullPath,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes),
          createdAt: obj.created_at,
          updatedAt: obj.updated_at,
          etag: obj.metadata?.eTag,
          mimetype: obj.metadata?.mimetype,
          classification,
          notes,
        });
      }
    }

    // 2. Scan resources/ (documents / PDFs)
    const docObjects = await listStorageObjectsInFolder(client, bucket, 'resources');
    for (const obj of docObjects) {
      // Exclude nested folders like covers
      if (!obj.name || obj.name === 'covers' || obj.name === '.emptyFolderPlaceholder') continue;
      // Also exclude objects that are folders (no id or size null)
      if (obj.id === null) continue;

      totalScanned++;
      const fullPath = `${bucket}/resources/${obj.name}`;

      if (!activeReferences.has(fullPath)) {
        const sizeBytes = Number(obj.metadata?.size ?? 0);
        totalOrphanedBytes += sizeBytes;

        orphanedDocuments.push({
          bucket,
          folder: 'resources',
          name: obj.name,
          fullPath,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes),
          createdAt: obj.created_at,
          updatedAt: obj.updated_at,
          etag: obj.metadata?.eTag,
          mimetype: obj.metadata?.mimetype,
          classification: 'legacy_remnant',
          notes: 'Remnant of deleted document/resource',
        });
      }
    }
  }

  return {
    totalScanned,
    totalActiveReferenced: activeReferences.size,
    orphanedCovers,
    orphanedDocuments,
    totalOrphanedBytes,
    totalOrphanedFormatted: formatBytes(totalOrphanedBytes),
  };
}

/**
 * Permanently delete orphaned storage files via Supabase Storage API
 */
export async function deleteOrphanedFiles(
  client: SupabaseClient,
  orphanedFiles: IOrphanedFile[],
): Promise<{ deleted: number; freedBytes: number; failed: number }> {
  let deleted = 0;
  let freedBytes = 0;
  let failed = 0;

  // Group files by bucket
  const byBucket = new Map<string, IOrphanedFile[]>();
  for (const file of orphanedFiles) {
    const list = byBucket.get(file.bucket) ?? [];
    list.push(file);
    byBucket.set(file.bucket, list);
  }

  for (const [bucket, files] of byBucket.entries()) {
    const paths = files.map((f) => `${f.folder}/${f.name}`);
    console.log(`  Deleting ${paths.length} file(s) from bucket "${bucket}"...`);
    const { error } = await client.storage.from(bucket).remove(paths);
    if (error) {
      console.error(`  ❌ Failed to delete files from "${bucket}":`, error.message);
      failed += paths.length;
    } else {
      deleted += paths.length;
      freedBytes += files.reduce((acc, f) => acc + f.sizeBytes, 0);
      for (const f of files) {
        console.log(`    ✓ Deleted: ${f.fullPath} (${f.sizeFormatted})`);
      }
    }
  }

  return { deleted, freedBytes, failed };
}

export async function main(): Promise<void> {
  const args = parseCliArgs();
  if (args.help) {
    printHelp();
    return;
  }

  const client = getSyncSupabaseClient({ local: args.local, env: args.env });
  const buckets = args.country ? [args.country] : SUPPORTED_BUCKETS;

  console.log(`\n🔍 Scanning Supabase Storage (${args.local ? 'LOCAL' : 'REMOTE'})...`);
  const audit = await auditOrphanedResources(client, { buckets });

  console.log(`\n======================================================`);
  console.log(`             STORAGE HOUSEKEEPING AUDIT               `);
  console.log(`======================================================`);
  console.log(`Total storage objects scanned: ${audit.totalScanned}`);
  console.log(`Active database references:   ${audit.totalActiveReferenced}`);
  console.log(`Orphaned cover images:        ${audit.orphanedCovers.length}`);
  console.log(`Orphaned documents:           ${audit.orphanedDocuments.length}`);
  console.log(`Total reclaimable space:      ${audit.totalOrphanedFormatted}`);
  console.log(`======================================================\n`);

  if (audit.orphanedCovers.length > 0) {
    console.log(`🖼️  ORPHANED COVERS (${audit.orphanedCovers.length}):`);
    for (const c of audit.orphanedCovers) {
      console.log(`  - [${c.classification.toUpperCase()}] ${c.fullPath} (${c.sizeFormatted}) - ${c.notes}`);
    }
    console.log('');
  }

  if (audit.orphanedDocuments.length > 0) {
    console.log(`📄 ORPHANED DOCUMENTS (${audit.orphanedDocuments.length}):`);
    for (const d of audit.orphanedDocuments) {
      console.log(`  - [${d.classification.toUpperCase()}] ${d.fullPath} (${d.sizeFormatted}) - ${d.notes}`);
    }
    console.log('');
  }

  const allOrphans = [...audit.orphanedCovers, ...audit.orphanedDocuments];

  if (allOrphans.length === 0) {
    console.log('✅ Storage is clean! No orphaned files found.\n');
    return;
  }

  if (!args.execute) {
    console.log(`ℹ️  DRY RUN complete. No files were removed.`);
    console.log(`   To permanently delete these ${allOrphans.length} orphaned files, run:`);
    console.log(`   yarn scripts:resources:housekeeping --execute${args.local ? ' --local' : ''}\n`);
    return;
  }

  console.log(`⚠️  Executing deletion of ${allOrphans.length} orphaned files...`);
  const result = await deleteOrphanedFiles(client, allOrphans);
  console.log(`\n🎉 Housekeeping complete! Deleted ${result.deleted} files, freed ${formatBytes(result.freedBytes)}.`);
  if (result.failed > 0) {
    console.warn(`⚠️  Failed to delete ${result.failed} files.`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

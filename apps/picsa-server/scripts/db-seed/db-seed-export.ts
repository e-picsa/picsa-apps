import { SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { allSettledInBatches } from '@picsa/utils/async.utils';
import { getMimeType } from '@picsa/utils/mimetypes';

import {
  SEED_DATA_CONFIG,
  SEED_DATA_EXTENDED_CONFIG,
  SEED_METADATA_COLUMNS,
  ISeedDataConfiguration,
} from './db-seed.config';
import { getExportSupabaseClient } from '../utils/supabase.utils';
import { StorageFileCache, IStorageObjectMeta } from '../utils/storage-cache.utils';
import { SupabaseSeed } from './db-seed';

const ROOT_DIR = resolve(__dirname, '../../../../');
const SUPABASE_DIR = resolve(__dirname, '../../', 'supabase');
const SEED_DIR = resolve(SUPABASE_DIR, 'data');
const CACHE_DIR = resolve(__dirname, 'cache');
const STORAGE_CACHE_DIR = resolve(CACHE_DIR, 'storage');
/** Parallel storage downloads/uploads during extended seeding */
const STORAGE_MIRROR_CONCURRENCY = 6;
/** Max storage object names sent per metadata lookup (keeps PostgREST URLs bounded) */
const STORAGE_META_CHUNK_SIZE = 100;

interface ExportTableConfig {
  table: string;
  config: ISeedDataConfiguration;
}

export interface SeedExportCliOptions {
  tables?: string[];
  country?: string;
  extended?: boolean;
  noFetch?: boolean;
  noDownload?: boolean;
  writeCsv?: boolean;
}

export function parseExportCliArgs(argv = process.argv.slice(2)): SeedExportCliOptions {
  const options: SeedExportCliOptions = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--extended') {
      options.extended = true;
      options.writeCsv = false;
      continue;
    }
    if (arg === '--no-fetch') {
      options.noFetch = true;
      continue;
    }
    if (arg === '--no-download') {
      options.noDownload = true;
      continue;
    }
    if (arg === '--no-csv') {
      options.writeCsv = false;
      continue;
    }
    if (arg === '--csv') {
      options.writeCsv = true;
      continue;
    }

    if (arg.startsWith('--tables=')) {
      options.tables = arg
        .slice('--tables='.length)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      continue;
    }
    if (arg === '-t' || arg === '--tables') {
      const next = argv[++i];
      if (next) {
        options.tables = next
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
      continue;
    }

    if (arg.startsWith('--country=')) {
      options.country = arg.slice('--country='.length).trim().toLowerCase();
      continue;
    }
    if (arg === '-c' || arg === '--country') {
      const next = argv[++i];
      if (next) {
        options.country = next.trim().toLowerCase();
      }
      continue;
    }
  }

  return options;
}

/**
 * Utility class to export seed data from remote Supabase.
 *
 * Supports two modes:
 * 1. Standard CSV Export (`yarn nx run picsa-server:db:seed:export`):
 *    Exports filtered seed data from remote into `supabase/data/*_rows.csv`.
 * 2. Extended Seed (`yarn nx run picsa-server:db:seed:extended`):
 *    Pulls full unfiltered remote data (`SEED_DATA_EXTENDED_CONFIG`), verifies remote
 *    access and caches records BEFORE resetting the local database, and directly seeds
 *    into local Postgres without writing CSV files. Supports `--no-fetch` for offline
 *    record caching, `--no-download` for offline storage (seeds referenced files from
 *    the local storage cache only), and reuses downloaded storage files via
 *    `StorageFileCache` so unchanged remote files are not re-fetched on repeat runs.
 */
export class SupabaseSeedExport {
  private remoteClient?: SupabaseClient<any, 'public', any>;
  private localClient?: SupabaseClient<any, 'public', any>;
  private readonly storageCache = new StorageFileCache(STORAGE_CACHE_DIR);
  /** Every storage file referenced by the active configuration, used to prune orphaned cache entries */
  private readonly referencedStoragePaths = new Set<string>();
  private noDownload = false;

  public async run(options: SeedExportCliOptions = parseExportCliArgs()) {
    const isExtended = Boolean(options.extended);
    const writeCsv = options.writeCsv ?? !isExtended;
    this.noDownload = Boolean(options.noDownload);

    console.log(
      `\n🚀 Starting ${isExtended ? 'extended database seed (direct to local DB)' : 'seed data export to CSV'}...\n`,
    );

    // Select configuration
    const activeConfig = isExtended ? SEED_DATA_EXTENDED_CONFIG : SEED_DATA_CONFIG;

    let exportTables = Object.entries(activeConfig).map(([table, config]) => ({
      table,
      config,
    })) as ExportTableConfig[];

    // Sort tables by priority so parent tables are loaded before child tables
    exportTables.sort((a, b) => {
      const aPriority = a.config.priority || 0;
      const bPriority = b.config.priority || 0;
      if (aPriority === bPriority) return a.table.length > b.table.length ? 1 : -1;
      return aPriority < bPriority ? 1 : -1;
    });

    // Filter tables if requested
    if (options.tables && options.tables.length > 0) {
      const requested = new Set(options.tables.map((t) => t.toLowerCase()));
      exportTables = exportTables.filter((t) => requested.has(t.table.toLowerCase()));
      if (exportTables.length === 0) {
        console.warn(`⚠️  No configured seed tables match the filter: ${options.tables.join(', ')}`);
        return;
      }
    }

    console.log(`📋 Tables: ${exportTables.map((t) => t.table).join(', ')}`);
    console.log(`🎯 Destination: ${writeCsv ? `CSV (${SEED_DIR})` : 'Local Supabase Database'}`);
    if (options.country) {
      console.log(`🌍 Country filter: ${options.country.toUpperCase()}`);
    }
    console.log('');

    // STEP 1: Obtain records (either from local cache via --no-fetch, or fetched from remote FIRST)
    const tableDataMap: Record<string, { rows: any[]; schema: string; config: ISeedDataConfiguration }> = {};

    if (isExtended && options.noFetch) {
      console.log(`📦 [--no-fetch] Loading seed data from per-table cache directory: ${CACHE_DIR}`);
      if (!existsSync(CACHE_DIR)) {
        console.error(`\n❌ Cache directory not found: ${CACHE_DIR}`);
        console.error('  Run extended seed without `--no-fetch` first to populate the cache.\n');
        process.exit(1);
      }
      for (const { table, config } of exportTables) {
        const tableCacheFile = resolve(CACHE_DIR, `${table}.json`);
        if (existsSync(tableCacheFile)) {
          const rawCache = await readFile(tableCacheFile, 'utf-8');
          const rows = JSON.parse(rawCache);
          tableDataMap[table] = {
            rows,
            schema: config.schema || 'public',
            config,
          };
          console.log(`   Loaded ${rows.length} rows for ${table} from cache`);
        } else {
          console.warn(`⚠️  Cache file missing for ${table}: ${tableCacheFile}`);
        }
      }
    } else {
      // Connect to remote Supabase (one-way pull with secret key)
      console.log('📡 Connecting to remote Supabase server...');
      this.remoteClient = getExportSupabaseClient();

      console.log('📥 Fetching remote tables before modifying local database...\n');
      for (const { table, config } of exportTables) {
        const schema = config.schema || 'public';
        const batchSize = config.batchSize ?? 1000;
        const orderBy = config.orderBy ?? 'id';
        const filter = this.buildTableFilter(table, schema, config.filter, options.country);

        try {
          console.log(`📥 Fetching ${schema}.${table}...`);
          const rows = await this.fetchAllRows(table, schema, batchSize, filter, orderBy);
          tableDataMap[table] = { rows, schema, config };
          console.log(`   Fetched ${rows.length} rows from ${schema}.${table}`);
        } catch (error) {
          console.error(`\n❌ Failed to fetch ${schema}.${table} from remote:`, error);
          console.error('Local database has NOT been reset or modified.\n');
          process.exit(1);
        }
      }

      // If extended seed, cache fetched records locally in separate JSON files per table
      if (isExtended) {
        try {
          await mkdir(CACHE_DIR, { recursive: true });
          for (const [t, data] of Object.entries(tableDataMap)) {
            const tableCacheFile = resolve(CACHE_DIR, `${t}.json`);
            await writeFile(tableCacheFile, JSON.stringify(data.rows, null, 2), 'utf-8');
          }
          console.log(`\n💾 Saved fetched seed data to per-table cache in: ${CACHE_DIR}`);
        } catch (cacheError) {
          console.warn('⚠️  Could not write per-table cache files:', cacheError);
        }
      }
    }

    // STEP 2: Write to destination
    const results: { table: string; rows: number; schema: string; destination: string }[] = [];

    if (writeCsv) {
      await mkdir(SEED_DIR, { recursive: true });
      for (const [table, { rows, schema, config }] of Object.entries(tableDataMap)) {
        if (rows.length === 0) {
          console.log(`⚠️  Skipped ${schema}.${table}: 0 rows returned\n`);
          results.push({ table, rows: 0, schema, destination: 'skipped' });
          continue;
        }
        const omitColumns = [...SEED_METADATA_COLUMNS, ...(config.omitColumns ?? [])];
        await this.writeTableCsv(table, rows, omitColumns);
        console.log(`✅ Exported ${schema}.${table}: ${rows.length} rows written to CSV\n`);
        results.push({ table, rows: rows.length, schema, destination: 'csv' });
      }
      console.log(`\n✅ Seed export completed! Files written to ${SEED_DIR}`);
    } else {
      // Extended direct DB seeding:
      // Remote data is confirmed! Now reset the local database.
      console.log('\n🔄 Resetting local Supabase database to clean migration baseline...');
      const supabaseCLIPath = resolve(ROOT_DIR, 'node_modules/.bin/supabase');
      try {
        execSync(`${supabaseCLIPath} db reset`, { cwd: SUPABASE_DIR, stdio: 'inherit' });
      } catch (resetErr) {
        console.error('❌ Failed to reset local database:', resetErr);
        process.exit(1);
      }

      // Initialize local seed helper and client
      const localSeed = new SupabaseSeed();
      this.localClient = localSeed.initClient();
      await localSeed.ensureClientReady();

      // IMPORTANT: Upload local storage assets FIRST so foreign keys (like deployments.icon_path) resolve
      console.log('\n📦 Step 1/4: Seeding local storage assets...');
      await localSeed.importStorageObjects();

      // Reuse previously downloaded remote storage files instead of re-fetching them all
      this.storageCache.load();
      console.log(`📦 Storage file cache: ${STORAGE_CACHE_DIR}`);

      // Retrieve list of existing storage paths to safely validate foreign keys
      const { data: storageObjectRows } = await this.localClient
        .schema('public')
        .from('storage_objects')
        .select('path');
      const validStoragePaths = new Set<string>((storageObjectRows || []).map((r: any) => r.path));

      console.log('\n🌱 Step 2/4: Upserting extended database records...');
      for (const [table, { rows, schema, config }] of Object.entries(tableDataMap)) {
        if (rows.length === 0) {
          results.push({ table, rows: 0, schema, destination: 'skipped' });
          continue;
        }

        // Mirror referenced storage files first so rows satisfy storage foreign
        // keys and remain downloadable offline (see mirrorStorage in db-seed.config)
        if (config.mirrorStorage?.length) {
          await this.mirrorStorageFiles(rows, config.mirrorStorage, validStoragePaths);
        }

        const omitColumns = [...SEED_METADATA_COLUMNS, ...(config.omitColumns ?? [])];
        await this.upsertLocalRows(table, schema, rows, config, omitColumns, validStoragePaths);
        console.log(`✅ Seeded ${schema}.${table}: ${rows.length} rows upserted to local DB`);
        results.push({ table, rows: rows.length, schema, destination: 'local db' });
      }

      // Drop cached files no longer referenced so the gitignored cache cannot grow unbounded.
      // Skipped for partial (`--tables` / `--country`) runs, which don't see the full reference set.
      const isPartialRun = Boolean(options.tables?.length || options.country);
      if (!isPartialRun) {
        const pruned = this.storageCache.prune(this.referencedStoragePaths);
        if (pruned > 0) console.log(`\n🧹 Removed ${pruned} orphaned storage cache file(s)`);
      }
      this.storageCache.save();

      console.log('\n👤 Step 3/4: Configuring dev users and deployment admin permissions...');
      await localSeed.seedDevUsersAndPermissions();

      console.log('\n🔑 Step 4/4: Storing frontend credentials...');
      const credentials = localSeed.getCredentials();
      await localSeed.storeFrontendCredentials(credentials.API_URL, credentials.ANON_KEY);

      console.log('\n🎉 Extended seed complete! Local database fully reflects remote server data.');
    }

    // Summary
    console.log('\n📊 Operation Summary:');
    console.table(
      results.map((r) => ({
        Table: r.table,
        Schema: r.schema,
        Rows: r.rows,
        Destination: r.destination,
      })),
    );
  }

  /**
   * Builds effective filter combining table configuration with CLI options
   */
  private buildTableFilter(
    table: string,
    schema: string,
    configFilter: ISeedDataConfiguration['filter'],
    country?: string,
  ): Record<string, any> | undefined {
    let filter: Record<string, any> = configFilter ? { ...configFilter } : {};

    // If --country is specified, apply relevant country filtering
    if (country) {
      const countryCode = country.toLowerCase();

      if (['climate_stations', 'crop_data', 'crop_data_downscaled', 'feedback_reports'].includes(table)) {
        filter['country_code'] = countryCode;
      } else if (table === 'climate_station_data') {
        filter['station_id'] = { operator: 'like', value: `${countryCode}/%` };
      } else if (schema === 'geo' && table === 'countries') {
        filter['code'] = countryCode;
      } else if (schema === 'geo' && (table === 'locales' || table === 'boundaries')) {
        filter['country_code'] = countryCode;
      }
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /** Fetch every row via chunked pagination with deterministic ordering */
  private async fetchAllRows(
    table: string,
    schema: string,
    batchSize: number,
    filter: Record<string, any> | undefined,
    orderBy: string | string[],
  ): Promise<any[]> {
    if (!this.remoteClient) throw new Error('Remote client not initialized');

    let offset = 0;
    const allRows: any[] = [];

    while (true) {
      let query = this.remoteClient.schema(schema).from(table).select('*');

      for (const column of Array.isArray(orderBy) ? orderBy : [orderBy]) {
        query = query.order(column);
      }

      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          if (value && typeof value === 'object' && 'operator' in value) {
            if (value.operator === 'like') {
              query = query.like(key, value.value);
            } else if (value.operator === 'ilike') {
              query = query.ilike(key, value.value);
            } else if (value.operator === 'in') {
              query = query.in(key, value.value);
            }
          } else if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }

      const { data, error } = await query.range(offset, offset + batchSize - 1);

      if (error) {
        throw buildExportError(schema, table, error);
      }

      if (!data || data.length === 0) {
        break;
      }

      allRows.push(...data);
      offset += batchSize;

      if (allRows.length % (batchSize * 5) === 0) {
        console.log(`   ... fetched ${allRows.length} rows so far`);
      }
    }

    return allRows;
  }

  /**
   * Download storage files referenced by staged rows from remote into local buckets.
   * Runs ahead of row upserts so storage foreign keys resolve and files stay
   * downloadable offline. Null values are preserved (e.g. tombstoned rows).
   *
   * Freshness is decided from remote `storage.objects` metadata (one lookup per
   * bucket/chunk) diffed against the on-disk `StorageFileCache`, so unchanged
   * files are uploaded from disk rather than re-downloaded on every extended run.
   * Files that cannot be mirrored null the referencing column (with warning) so
   * the import still succeeds - the row stays live remotely and reappears later.
   */
  private async mirrorStorageFiles(rows: any[], columns: string[], validStoragePaths: Set<string>): Promise<void> {
    if (!this.remoteClient || !this.localClient) return;
    const missing = new Map<string, { row: any; column: string }[]>();
    for (const row of rows) {
      for (const column of columns) {
        const file = row?.[column] as string | null;
        if (!file) continue;
        this.referencedStoragePaths.add(file);
        if (validStoragePaths.has(file)) continue;
        const list = missing.get(file) ?? [];
        list.push({ row, column });
        missing.set(file, list);
      }
    }
    if (missing.size === 0) return;

    const storagePaths = [...missing.keys()];
    const { meta: remoteMeta, complete } = await this.fetchRemoteStorageMeta(storagePaths);
    const cachedCount = storagePaths.filter((file) => this.isCacheFresh(file, remoteMeta.get(file), complete)).length;
    console.log(
      `   Mirroring ${storagePaths.length} storage files (${cachedCount} cached, ${storagePaths.length - cachedCount} to download)...`,
    );

    await this.ensureStorageBuckets(storagePaths);

    const stats = { uploaded: 0, downloaded: 0, failed: 0 };
    const tasks = storagePaths.map((file) => async () => {
      const refs = missing.get(file)!;
      try {
        const { bytes, downloaded } = await this.loadStorageBytes(file, remoteMeta.get(file), complete);
        if (downloaded) stats.downloaded++;
        await this.uploadStorageBytes(file, bytes, refs[0]?.row?.mimetype);
        validStoragePaths.add(file);
        stats.uploaded++;
      } catch {
        console.warn(`   ⚠️  Could not mirror ${file} - nulling ${refs.length} reference(s)`);
        for (const { row, column } of refs) row[column] = null;
        stats.failed++;
      }
    });

    await allSettledInBatches(tasks, STORAGE_MIRROR_CONCURRENCY);
    this.storageCache.save();
    console.log(
      `   Mirrored ${stats.uploaded}/${storagePaths.length} storage files (${stats.downloaded} downloaded, ${stats.failed} failed)`,
    );
  }

  /**
   * Look up remote `storage.objects` metadata for the referenced paths so cached
   * files can be validated in a handful of requests instead of by re-downloading.
   * `complete` is false when any lookup failed, in which case missing entries are
   * ambiguous and callers fall back to size-only cache validation.
   */
  private async fetchRemoteStorageMeta(
    storagePaths: string[],
  ): Promise<{ meta: Map<string, IStorageObjectMeta>; complete: boolean }> {
    const meta = new Map<string, IStorageObjectMeta>();
    if (!this.remoteClient || storagePaths.length === 0) return { meta, complete: false };

    const byBucket = new Map<string, string[]>();
    for (const storagePath of storagePaths) {
      const [bucket, ...segments] = storagePath.split('/');
      const names = byBucket.get(bucket) ?? [];
      names.push(segments.join('/'));
      byBucket.set(bucket, names);
    }

    const tasks: (() => Promise<void>)[] = [];
    for (const [bucket, names] of byBucket) {
      for (let i = 0; i < names.length; i += STORAGE_META_CHUNK_SIZE) {
        const chunk = names.slice(i, i + STORAGE_META_CHUNK_SIZE);
        tasks.push(async () => {
          const { data, error } = await this.remoteClient!.schema('storage')
            .from('objects')
            .select('name, metadata, updated_at')
            .eq('bucket_id', bucket)
            .in('name', chunk);
          if (error) throw error;
          for (const row of (data ?? []) as { name: string; metadata?: any; updated_at?: string }[]) {
            meta.set(`${bucket}/${row.name}`, {
              size: Number(row.metadata?.size ?? row.metadata?.contentLength) || null,
              etag: row.metadata?.eTag ?? row.metadata?.etag ?? null,
              updatedAt: row.updated_at ?? null,
            });
          }
        });
      }
    }

    const results = await allSettledInBatches(tasks, STORAGE_MIRROR_CONCURRENCY);
    for (const result of results) {
      if (result.status === 'rejected') {
        console.warn(`   ⚠️  Could not read remote storage metadata: ${String(result.reason)}`);
      }
    }
    return { meta, complete: results.every((result) => result.status === 'fulfilled') };
  }

  /**
   * Cached bytes are reusable only when they still match the remote object.
   * A path missing from a complete remote lookup no longer exists remotely, so
   * its cache entry must not be reused (avoids resurrecting deleted objects).
   */
  private isCacheFresh(
    storagePath: string,
    remote: IStorageObjectMeta | undefined,
    remoteLookupComplete: boolean,
  ): boolean {
    if (!remote && remoteLookupComplete) return false;
    return this.storageCache.isFresh(storagePath, remote);
  }

  /** Resolve bytes from the local cache when fresh, otherwise download once and cache the result */
  private async loadStorageBytes(
    storagePath: string,
    remote: IStorageObjectMeta | undefined,
    remoteLookupComplete: boolean,
  ): Promise<{ bytes: Buffer; downloaded: boolean }> {
    if (this.isCacheFresh(storagePath, remote, remoteLookupComplete)) {
      const cached = this.storageCache.read(storagePath);
      if (cached) return { bytes: cached, downloaded: false };
    }
    if (this.noDownload) {
      // Offline: fall back to any cached copy even when freshness could not be verified
      const cached = this.storageCache.read(storagePath);
      if (cached) return { bytes: cached, downloaded: false };
      throw new Error('--no-download set and file is not present in the local storage cache');
    }
    const [bucket, ...segments] = storagePath.split('/');
    const { data: blob, error } = await this.remoteClient!.storage.from(bucket).download(segments.join('/'));
    if (error || !blob) throw error ?? new Error('empty download');
    const bytes = Buffer.from(await blob.arrayBuffer());
    this.storageCache.write(storagePath, bytes, remote);
    return { bytes, downloaded: true };
  }

  /** Upload bytes into the local Supabase storage bucket */
  private async uploadStorageBytes(storagePath: string, bytes: Buffer, mimetype?: string | null): Promise<void> {
    const [bucket, ...segments] = storagePath.split('/');
    if (!bucket || segments.length === 0) throw new Error(`Invalid storage path: ${storagePath}`);
    const contentType = mimetype || getMimeType(storagePath) || 'application/octet-stream';
    const { error } = await this.localClient!.storage.from(bucket).upload(segments.join('/'), bytes, {
      upsert: true,
      contentType,
    });
    if (error) throw error;
  }

  /** Create any local buckets referenced by the staged storage paths */
  private async ensureStorageBuckets(storagePaths: string[]): Promise<void> {
    const buckets = new Set(storagePaths.map((file) => file.split('/')[0]));
    const { data: existingBuckets } = await this.localClient!.storage.listBuckets();
    const existing = new Set((existingBuckets || []).map((b: any) => b.name));
    for (const bucket of buckets) {
      if (existing.has(bucket)) continue;
      console.log(`   Creating local bucket: ${bucket}`);
      await this.localClient!.storage.createBucket(bucket, { public: true });
    }
  }

  /** Upsert fetched rows directly into local Supabase database */
  private async upsertLocalRows(
    table: string,
    schema: string,
    rows: any[],
    config: ISeedDataConfiguration,
    omitColumns: string[],
    validStoragePaths?: Set<string>,
  ): Promise<void> {
    if (!this.localClient) return;

    const omitSet = new Set(omitColumns);
    const parsedRows = rows.map((row) => {
      const processed: Record<string, any> = { ...row };
      for (const col of omitSet) {
        delete processed[col];
      }
      if (config.columnMappings) {
        for (const [col, mapping] of Object.entries(config.columnMappings)) {
          processed[col] = typeof mapping === 'function' ? mapping(processed[col], processed) : mapping;
        }
      }

      // Safe foreign-key protection for deployments:
      // If icon_path is set but does not exist in local storage_objects, set to null
      if (table === 'deployments' && validStoragePaths && processed.icon_path) {
        if (!validStoragePaths.has(processed.icon_path)) {
          console.warn(
            `⚠️  Deployment "${processed.id}": icon_path "${processed.icon_path}" not in local storage. Setting to null to satisfy foreign key.`,
          );
          processed.icon_path = null;
        }
      }

      return processed;
    });

    const chunkSize = 500;
    for (let i = 0; i < parsedRows.length; i += chunkSize) {
      const chunk = parsedRows.slice(i, i + chunkSize);
      const { error } = await this.localClient.schema(schema).from(table).upsert(chunk);
      if (error) {
        throw new Error(`Local upsert failed for ${schema}.${table}: ${error.message}`);
      }
    }
  }

  /** Strip omitted columns, stringify JSON values and write the CSV file */
  private async writeTableCsv(table: string, rows: any[], omitColumns: string[]): Promise<void> {
    const omitSet = new Set(omitColumns);
    const processedRows = rows.map((row) => {
      const processed: Record<string, any> = { ...row };

      for (const col of omitSet) {
        delete processed[col];
      }

      for (const [key, value] of Object.entries(processed)) {
        if (value !== null && typeof value === 'object') {
          processed[key] = JSON.stringify(value);
        }
      }

      return processed;
    });

    const csv = Papa.unparse(processedRows, {
      header: true,
      skipEmptyLines: true,
    });

    const fileName = `${table}_rows.csv`;
    const filePath = resolve(SEED_DIR, fileName);
    await writeFile(filePath, csv, 'utf-8');
  }
}

/** Map PostgREST errors to actionable messages */
function buildExportError(schema: string, table: string, error: { message: string }): Error {
  if (error.message.includes('Invalid schema')) {
    return new Error(
      `Query failed for ${schema}.${table}: schema "${schema}" is not exposed on remote. ` +
        `Add it under Data API settings (Dashboard → Project Settings → API → Exposed schemas). ` +
        `Original error: ${error.message}`,
    );
  }
  return new Error(`Query failed for ${schema}.${table}: ${error.message}`);
}

if (require.main === module) {
  new SupabaseSeedExport().run().catch((error) => {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  });
}

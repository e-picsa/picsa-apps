import { SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

import {
  SEED_DATA_CONFIG,
  SEED_DATA_EXTENDED_CONFIG,
  SEED_METADATA_COLUMNS,
  ISeedDataConfiguration,
} from './db-seed.config';
import { getExportSupabaseClient } from '../utils/supabase.utils';
import { SupabaseSeed } from './db-seed';

const ROOT_DIR = resolve(__dirname, '../../../../');
const SUPABASE_DIR = resolve(__dirname, '../../', 'supabase');
const SEED_DIR = resolve(SUPABASE_DIR, 'data');
const CACHE_DIR = resolve(__dirname, 'cache');

interface ExportTableConfig {
  table: string;
  config: ISeedDataConfiguration;
}

export interface SeedExportCliOptions {
  tables?: string[];
  country?: string;
  extended?: boolean;
  noFetch?: boolean;
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
 *    into local Postgres without writing CSV files. Supports `--no-fetch` for offline caching.
 */
export class SupabaseSeedExport {
  private remoteClient?: SupabaseClient<any, 'public', any>;
  private localClient?: SupabaseClient<any, 'public', any>;

  public async run(options: SeedExportCliOptions = parseExportCliArgs()) {
    const isExtended = Boolean(options.extended);
    const writeCsv = options.writeCsv ?? !isExtended;

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

        const omitColumns = [...SEED_METADATA_COLUMNS, ...(config.omitColumns ?? [])];
        await this.upsertLocalRows(table, schema, rows, config, omitColumns, validStoragePaths);
        console.log(`✅ Seeded ${schema}.${table}: ${rows.length} rows upserted to local DB`);
        results.push({ table, rows: rows.length, schema, destination: 'local db' });
      }

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

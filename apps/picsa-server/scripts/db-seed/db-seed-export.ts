import { SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  SEED_DATA_CONFIG,
  SEED_DATA_EXTENDED_CONFIG,
  SEED_METADATA_COLUMNS,
  ISeedDataConfiguration,
} from './db-seed.config';
import { getExportSupabaseClient, getLocalSupabaseClient } from '../utils/supabase.utils';
import { SupabaseSeed } from './db-seed';

const SUPABASE_DIR = resolve(__dirname, '../../', 'supabase');
const SEED_DIR = resolve(SUPABASE_DIR, 'data');

interface ExportTableConfig {
  table: string;
  config: ISeedDataConfiguration;
}

export interface SeedExportCliOptions {
  tables?: string[];
  country?: string;
  extended?: boolean;
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
 *    Pulls full unfiltered remote data (`SEED_DATA_EXTENDED_CONFIG`) and directly
 *    seeds it into the local database without writing CSV files.
 */
export class SupabaseSeedExport {
  private remoteClient: SupabaseClient<any, 'public', any>;
  private localClient?: SupabaseClient<any, 'public', any>;

  public async run(options: SeedExportCliOptions = parseExportCliArgs()) {
    const isExtended = Boolean(options.extended);
    const writeCsv = options.writeCsv ?? !isExtended;

    console.log(
      `\n🚀 Starting ${isExtended ? 'extended database seed (direct to local DB)' : 'seed data export to CSV'}...\n`,
    );

    // Get remote client (pull-only usage with secret key)
    this.remoteClient = getExportSupabaseClient();

    // If writing directly to local DB, initialize local client
    if (!writeCsv) {
      this.localClient = getLocalSupabaseClient();
    } else {
      await mkdir(SEED_DIR, { recursive: true });
    }

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

    const results: { table: string; rows: number; schema: string; destination: string }[] = [];

    // Export each table sequentially
    for (const { table, config } of exportTables) {
      const schema = config.schema || 'public';
      const batchSize = config.batchSize ?? 1000;
      const orderBy = config.orderBy ?? 'id';
      const omitColumns = [...SEED_METADATA_COLUMNS, ...(config.omitColumns ?? [])];

      // Build effective filter combining config and country flags
      const filter = this.buildTableFilter(table, schema, config.filter, options.country);

      try {
        console.log(`📥 Fetching ${schema}.${table}...`);
        const rows = await this.fetchAllRows(table, schema, batchSize, filter, orderBy);

        if (rows.length === 0) {
          console.log(`⚠️  Skipped ${schema}.${table}: 0 rows returned\n`);
          results.push({ table, rows: 0, schema, destination: 'skipped' });
          continue;
        }

        if (writeCsv) {
          await this.writeTableCsv(table, rows, omitColumns);
          console.log(`✅ Exported ${schema}.${table}: ${rows.length} rows written to CSV\n`);
          results.push({ table, rows: rows.length, schema, destination: 'csv' });
        } else {
          await this.upsertLocalRows(table, schema, rows, config, omitColumns);
          console.log(`✅ Seeded ${schema}.${table}: ${rows.length} rows upserted to local DB\n`);
          results.push({ table, rows: rows.length, schema, destination: 'local db' });
        }
      } catch (error) {
        console.error(`❌ Failed to process ${schema}.${table}:`, error);
        process.exit(1);
      }
    }

    // Summary
    console.log('📊 Operation Summary:');
    console.table(
      results.map((r) => ({
        Table: r.table,
        Schema: r.schema,
        Rows: r.rows,
        Destination: r.destination,
      })),
    );

    // If extended direct seed, run local seed to ensure storage objects and dev users are populated
    if (!writeCsv) {
      console.log('\n🌱 Initializing local storage objects and baseline configuration...');
      try {
        const localSeed = new SupabaseSeed();
        await localSeed.run();
      } catch (error: any) {
        console.warn('⚠️  Notice: Local baseline seed returned a warning:', error?.message || error);
      }
      console.log('\n🎉 Extended seed complete! Local database now reflects remote server data.');
    } else {
      console.log(`\n✅ Seed export completed! Files written to ${SEED_DIR}`);
    }
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
    console.error('❌ Export failed:', error);
    process.exit(1);
  });
}

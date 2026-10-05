import { SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { SEED_DATA_CONFIGURATION, SEED_METADATA_COLUMNS, ISeedDataConfiguration } from './db-seed.config';
import { getExportSupabaseClient } from '../utils/supabase.utils';

const SUPABASE_DIR = resolve(__dirname, '../../', 'supabase');
const SEED_DIR = resolve(SUPABASE_DIR, 'data');

interface ExportTableConfig {
  table: string;
  config: ISeedDataConfiguration;
}

/**
 * Utility class to export seed data from remote Supabase to local CSV files
 *
 * Called from command:
 * ```sh
 * yarn nx run picsa-server:seed-export
 * ```
 *
 * ONE-WAY PULL ONLY: this script authenticates with the remote secret key
 * (required - anon/publishable is revoked on all seed tables, see migrations
 * 20260129134800_rls_updates.sql, 20260201000000_rls_updates additional.sql,
 * 20260128102700_deploment_admin.sql, 20260425120000_budget_sharing.sql), but
 * performs only remote SELECT queries (.select/.eq/.range). The only writes
 * are local CSV files via writeFile. Do not add
 * insert/update/delete/upsert calls to this file.
 */
class SupabaseSeedExport {
  private client: SupabaseClient<any, 'public', any>;

  public async run() {
    console.log('\n🚀 Starting seed data export from remote Supabase...\n');

    // Get export client (remote, secret key - pull-only usage, see class docs)
    this.client = getExportSupabaseClient();

    // Ensure seed directory exists
    await mkdir(SEED_DIR, { recursive: true });

    // Export every table in config - local-first tables are omitted from
    // SEED_DATA_CONFIGURATION so they are never overwritten from remote
    const exportTables = Object.entries(SEED_DATA_CONFIGURATION).map(([table, config]) => ({
      table,
      config,
    })) as ExportTableConfig[];

    console.log(`📋 Tables to export: ${exportTables.map((t) => t.table).join(', ')}\n`);

    const results: { table: string; rows: number; schema: string; skipped: boolean }[] = [];

    // Export each table sequentially
    for (const { table, config } of exportTables) {
      const schema = config.schema || 'public';
      const batchSize = config.batchSize ?? 250;
      const filter = config.filter;
      const orderBy = config.orderBy ?? 'id';
      // Metadata columns are always stripped (DB defaults repopulate on import)
      const omitColumns = [...SEED_METADATA_COLUMNS, ...(config.omitColumns ?? [])];

      try {
        const { rows, skipped } = await this.exportTable(table, schema, batchSize, filter, orderBy, omitColumns);
        results.push({ table, rows, schema, skipped });
        if (skipped) {
          console.log(`⚠️  Skipped ${schema}.${table}: 0 rows returned, no file written\n`);
        } else {
          console.log(`✅ Exported ${schema}.${table}: ${rows} rows\n`);
        }
      } catch (error) {
        console.error(`❌ Failed to export ${schema}.${table}:`, error);
        process.exit(1);
      }
    }

    // Summary
    console.log('📊 Export Summary:');
    console.table(
      results.map((r) => ({
        Table: r.table,
        Schema: r.schema,
        Rows: r.skipped ? '0 (no output)' : r.rows,
      })),
    );

    console.log(`\n✅ Seed export completed! Files written to ${SEED_DIR}`);
  }

  /**
   * Export a single table to CSV with pagination and filtering
   */
  private async exportTable(
    table: string,
    schema: string,
    batchSize: number,
    filter: ISeedDataConfiguration['filter'],
    orderBy: string | string[],
    omitColumns: string[],
  ): Promise<{ rows: number; skipped: boolean }> {
    console.log(`📥 Fetching ${schema}.${table}...`);

    const allRows = await this.fetchAllRows(table, schema, batchSize, filter, orderBy);

    // Never write empty files - they break seed import and add repo noise
    if (allRows.length === 0) {
      return { rows: 0, skipped: true };
    }

    await this.writeTableCsv(table, allRows, omitColumns);

    return { rows: allRows.length, skipped: false };
  }

  /** Fetch every row via chunked pagination with deterministic ordering */
  private async fetchAllRows(
    table: string,
    schema: string,
    batchSize: number,
    filter: ISeedDataConfiguration['filter'],
    orderBy: string | string[],
  ): Promise<any[]> {
    let offset = 0;
    const allRows: any[] = [];

    while (true) {
      let query = this.client.schema(schema).from(table).select('*');

      // Deterministic row order for stable CSV diffs. Ordering is applied
      // server-side so sort columns work even when omitted from output.
      for (const column of Array.isArray(orderBy) ? orderBy : [orderBy]) {
        query = query.order(column);
      }

      // Apply filters if specified (arrays match any entry via IN)
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          query = Array.isArray(value) ? query.in(key, value) : query.eq(key, value);
        }
      }

      // Apply pagination
      const { data, error } = await query.range(offset, offset + batchSize - 1);

      if (error) {
        throw buildExportError(schema, table, error);
      }

      if (!data || data.length === 0) {
        break;
      }

      allRows.push(...data);
      offset += batchSize;

      // Progress indicator for large tables
      if (allRows.length % (batchSize * 10) === 0) {
        console.log(`   ... fetched ${allRows.length} rows so far`);
      }
    }

    return allRows;
  }

  /** Strip omitted columns, stringify JSON values and write the CSV file */
  private async writeTableCsv(table: string, rows: any[], omitColumns: string[]): Promise<void> {
    // Process rows: omit columns, stringify JSON objects/arrays
    const processedRows = rows.map((row) => {
      const processed: Record<string, any> = { ...row };

      // Remove omitted columns
      for (const col of omitColumns) {
        delete processed[col];
      }

      // Stringify objects and arrays for CSV compatibility
      for (const [key, value] of Object.entries(processed)) {
        if (value !== null && typeof value === 'object') {
          processed[key] = JSON.stringify(value);
        }
      }

      return processed;
    });

    // Convert to CSV using PapaParse
    const csv = Papa.unparse(processedRows, {
      header: true,
      skipEmptyLines: true,
    });

    // Write to file (flat name: table_rows.csv)
    const fileName = `${table}_rows.csv`;
    const filePath = resolve(SEED_DIR, fileName);
    await writeFile(filePath, csv, 'utf-8');
  }
}

/** Map PostgREST errors to actionable messages (e.g. unexposed remote schemas) */
function buildExportError(schema: string, table: string, error: { message: string }): Error {
  // PostgREST returns "Invalid schema" when the schema is not exposed in
  // the remote project's Data API settings - point at the fix directly.
  if (error.message.includes('Invalid schema')) {
    return new Error(
      `Query failed for ${schema}.${table}: schema "${schema}" is not exposed on remote. ` +
        `Add it under Data API settings (Dashboard → Project Settings → API → Exposed schemas), ` +
        `matching schemas in supabase/config.toml. Original error: ${error.message}`,
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

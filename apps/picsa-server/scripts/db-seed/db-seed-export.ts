import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { execSync } from 'child_process';

import { SEED_DATA_CONFIGURATION, ISeedDataConfiguration } from './db-seed.config';
import { getExportSupabaseClient } from '../utils/supabase.utils';

const ROOT_DIR = resolve(__dirname, '../../../../');
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
 * are local: CSV files via writeFile and a local gen-types run. Do not add
 * insert/update/delete/upsert calls to this file.
 */
class SupabaseSeedExport {
  private client: SupabaseClient<any, 'public', any>;

  public async run() {
    console.log('\n🚀 Starting seed data export from remote Supabase...\n');

    // Get export client (remote, readonly anon key)
    this.client = getExportSupabaseClient();

    // Ensure seed directory exists
    await mkdir(SEED_DIR, { recursive: true });

    // Filter tables: only export where serverSync !== false
    const exportTables = Object.entries(SEED_DATA_CONFIGURATION)
      .filter(([, config]) => config.serverSync !== false)
      .map(([table, config]) => ({ table, config })) as ExportTableConfig[];

    console.log(`📋 Tables to export: ${exportTables.map((t) => t.table).join(', ')}\n`);

    const results: { table: string; rows: number; schema: string; file: string }[] = [];

    // Export each table sequentially
    for (const { table, config } of exportTables) {
      const schema = config.schema || 'public';
      const batchSize = config.batchSize ?? 250;
      const filter = config.filter;
      const omitColumns = config.omitColumns ?? [];

      try {
        const { rows, file } = await this.exportTable(table, schema, batchSize, filter, omitColumns);
        results.push({ table, rows, schema, file });
        console.log(`✅ Exported ${schema}.${table}: ${rows} rows → ${file}\n`);
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
        Rows: r.rows,
        File: r.file.replace(SEED_DIR + '/', ''),
      })),
    );

    console.log(`\n✅ Seed export completed! ${results.length} tables exported to ${SEED_DIR}`);

    // Run gen-types to update TypeScript definitions
    console.log('\n🔄 Regenerating TypeScript types...');
    try {
      execSync('yarn nx run picsa-server:gen-types', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
      console.log('✅ TypeScript types regenerated\n');
    } catch (error) {
      console.error('⚠️  Type generation failed (run manually with: yarn nx run picsa-server:gen-types)');
      console.error(error);
    }
  }

  /**
   * Export a single table to CSV with pagination and filtering
   */
  private async exportTable(
    table: string,
    schema: string,
    batchSize: number,
    filter: Record<string, string | number | boolean> | undefined,
    omitColumns: string[],
  ): Promise<{ rows: number; file: string }> {
    let offset = 0;
    const allRows: any[] = [];

    console.log(
      `📥 Fetching ${schema}.${table} (batch size: ${batchSize}${filter ? `, filter: ${JSON.stringify(filter)}` : ''})...`,
    );

    while (true) {
      let query = this.client.schema(schema).from(table).select('*');

      // Apply filters if specified
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          query = query.eq(key, value);
        }
      }

      // Apply pagination
      const { data, error } = await query.range(offset, offset + batchSize - 1);

      if (error) {
        throw new Error(`Query failed for ${schema}.${table}: ${error.message}`);
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

    // Process rows: omit columns, stringify JSON objects/arrays
    const processedRows = allRows.map((row) => {
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

    return { rows: allRows.length, file: filePath };
  }
}

if (require.main === module) {
  new SupabaseSeedExport().run().catch((error) => {
    console.error('❌ Export failed:', error);
    process.exit(1);
  });
}

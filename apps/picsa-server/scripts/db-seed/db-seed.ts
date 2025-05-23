import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { loadCSV } from '@picsa/utils/data';
import { _wait } from '@picsa/utils/browser.utils';
import { readFileSync, readdirSync } from 'fs';
import { globSync } from 'glob';
import { lookup } from 'mime-types';

import { resolve } from 'path';
import { execSync } from 'child_process';

import { SEED_DATA_CONFIGURATION, ISeedDataConfiguration } from './db-seed.config';

const ROOT_DIR = resolve(__dirname, '../../../../');
const SUPABASE_DIR = resolve(__dirname, '../../', 'supabase');
const SEED_DIR = resolve(SUPABASE_DIR, 'data');
const SEED_STORAGE_DIR = resolve(SUPABASE_DIR, 'data', 'storage');

/**
 * Response model from `supbase status --output json` command
 * Used to detect local supabase api configuration
 */
interface ISupabaseStatus {
  ANON_KEY: string;
  API_URL: 'http://127.0.0.1:54321';
  DB_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  GRAPHQL_URL: 'http://127.0.0.1:54321/graphql/v1';
  INBUCKET_URL: 'http://127.0.0.1:54324';
  JWT_SECRET: string;
  SERVICE_ROLE_KEY: string;
  STUDIO_URL: 'http://127.0.0.1:54323';
}

/**
 * Utility class to enable local supabase seed data to be loaded
 * Uploads storage objects from local seed/storage folder, and database entries from csv.
 *
 * Called from command
 * ```sh
 * yarn nx run picsa-server:seed
 * ```
 *
 * @remarks
 * Whilst supabase does include a `seed.sql` file, the data can't be dynamically imported
 * from csv files https://github.com/orgs/supabase/discussions/9314
 */
class SupabaseSeed {
  private client: SupabaseClient<any, 'public', any>;

  public async run() {
    // log into supabase using service role to allow storage bucket manipulation
    const { SERVICE_ROLE_KEY, API_URL } = this.getCredentials();
    this.client = createClient(API_URL, SERVICE_ROLE_KEY, {});
    await this.ensureClientReady();
    // import storage objects first as some db rows depend on storage db entry ref
    await this.importStorageObjects();
    await this.importDBRows();
  }

  /** Use the supabase cli to automatically detect credentials of server running locally */
  private getCredentials() {
    const supabaseCLIPath = resolve(ROOT_DIR, 'node_modules', '.bin', 'supabase');
    const res = execSync(`${supabaseCLIPath} status --output json`, { cwd: SUPABASE_DIR });
    try {
      const status: ISupabaseStatus = JSON.parse(res.toString('utf8'));
      return status;
    } catch (error) {
      console.error({ res, error });
      throw 'Could not retrieve supabase credentials';
    }
  }

  /**
   * If calling seed operation immediately after reset the container may not be started
   * Attempt to access storage bucket list method, retrying in 5s intervals if not available
   */
  private async ensureClientReady(retryCount = 0) {
    const { error } = await this.client.storage.listBuckets();
    if (error) {
      console.log('wait error', error.name, error.message);
      if (retryCount < 6 && error.message.includes('An invalid response was received from the upstream server')) {
        console.log('Storage api not available, retrying in 5s...');
        await _wait(5000);
        return this.ensureClientReady(retryCount + 1);
      }
      console.log('Storage API did not respond, is the docker container running?\nSee troubleshooting at:');
      console.log('https://docs.picsa.app/server/setup#troubleshooting');
      console.error(error);
      process.exit(1);
    }
  }

  /**
   * Import all files in local supabase/data/storage folder into supabase storage
   * Creates new buckets as required and populates files to nested paths
   */
  private async importStorageObjects() {
    console.log('\n', '\n', 'Storage');
    const { storage } = this.client;
    // list all storage files to upload
    const entries = globSync('**', { stat: false, withFileTypes: true, cwd: SEED_STORAGE_DIR }).filter((g) =>
      g.isFile()
    );
    // check existing buckets
    const { data: bucketRows, error: listError } = await storage.listBuckets();
    if (listError) throw listError;
    const bucketNames = bucketRows.map((el) => el.name);
    // prepare uploads
    const results: any[] = [];
    for (const entry of entries) {
      const storagePath = entry.relativePosix();
      const localPath = entry.fullpath();
      const [bucketName, ...segments] = storagePath.split('/');
      // create storage bucket if does not exist
      if (!bucketNames.includes(bucketName)) {
        console.log(`[${bucketName}] bucket create`);
        const { error: bucketCreateError } = await storage.createBucket(bucketName, { public: true });
        if (bucketCreateError) {
          console.error('Failed to create storage bucket', bucketCreateError);
          process.exit(1);
        }
      }
      // upload file
      const bucketPath = segments.join('/');
      results.push({ file: bucketPath });
      // ensure mimetypes populated correctly
      // https://github.com/supabase/supabase/issues/6916
      const type = lookup(bucketPath);
      if (!type) throw new Error('Failed to lookup content type: ' + localPath);
      const fileBlob = new Blob([readFileSync(localPath)], { type });
      const { error: uploadError } = await storage.from(bucketName).upload(bucketPath, fileBlob, { upsert: true });
      if (uploadError) {
        console.error(`File upload failed`, { localPath, uploadError });
        process.exit(1);
      }
    }
    console.table(results);
  }

  /**
   * Import csv files in local supabase/data folder into supabase db
   * Table names will be assumed from csv filename (as exported from supabase)
   */
  private async importDBRows() {
    console.log('\n', '\n', 'DB');
    // specify tables that should be loaded with priority
    // e.g. ensure populated if linked table seed data references
    const tableNames = readdirSync(SEED_DIR, { withFileTypes: true })
      .filter((f) => f.isFile() && f.name.endsWith('_rows.csv'))
      .map((f) => f.name.replace(`_rows.csv`, ''))
      // ensure child rows processed after parent
      .sort((a, b) => {
        // ensure tables with priority are processed before those without
        const aPriority = SEED_DATA_CONFIGURATION[a]?.priority || 0;
        const bPriority = SEED_DATA_CONFIGURATION[b]?.priority || 0;
        // default sort by table name length to ensure child tables after parent
        if (aPriority === bPriority) return a.length > b.length ? 1 : -1;
        return aPriority < bPriority ? 1 : -1;
      });
    const results: any[] = [];
    console.log('Import Order: ', tableNames);
    for (const tableName of tableNames) {
      const csvFileName = `${tableName}_rows.csv`;
      const csvPath = resolve(SEED_DIR, csvFileName);
      const csvString = readFileSync(csvPath, { encoding: 'utf8' });
      const csvRows = await loadCSV(csvString, { dynamicTyping: true, header: true, skipEmptyLines: true });
      const seedConfig = SEED_DATA_CONFIGURATION[tableName];
      const parsedRows = parseCSVRows(csvRows, seedConfig);
      const { error, data, status, statusText } = await this.client.from(tableName).upsert(parsedRows).select('*');
      if (error) {
        console.error(`[${tableName}] import failed`, csvRows);
        console.error({ status, statusText, error });
        process.exit(1);
      }
      results.push({ table: tableName, rows: data.length });
    }
    console.table(results);
  }
}

if (require.main === module) {
  new SupabaseSeed().run();
}

/** Iterate over parsed csv rows and convert parse any stringified json content */
function parseCSVRows(rows: any[], config: ISeedDataConfiguration = {}) {
  const { omitColumns = [] } = config;
  return rows.map((row) => {
    for (const column of omitColumns) {
      delete row[column];
    }
    for (const [key, value] of Object.entries<any>(row)) {
      if (typeof value === 'string' && ['{', '['].includes(value[0])) {
        row[key] = JSON.parse(value);
      }
    }
    return row;
  });
}

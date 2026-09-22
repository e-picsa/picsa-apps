import type { Database } from '../../supabase/types';

export interface ISeedDataConfiguration {
  /** Omit columns from CSV (e.g. if auto-populated from other columns) */
  omitColumns?: string[];
  /**
   * Specify higher priority if table should be imported ahead of others
   * Default behaviour prioritises tables with shorter names before longer
   * */
  priority?: 1;
  /** Whether to sync/export this table from remote DB (default: true). Set false for local-first tables. */
  serverSync?: boolean;
  /** Batch size for paginated export (default: 250). Override per table if needed. */
  batchSize?: number;
  /** Database schema (default: 'public') */
  schema?: keyof Database;
  /** Optional filter query for subset exports (e.g., { country_code: 'zm', station_id: 'chipata_met' }) */
  filter?: Record<string, string | number | boolean>;
}

type IDBTableName = string; // Allow any table name including cross-schema

export const SEED_DATA_CONFIGURATION: Record<IDBTableName, ISeedDataConfiguration> = {
  // Public schema tables
  climate_stations: {
    omitColumns: ['id'],
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  crop_data: {
    omitColumns: ['id'],
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  crop_data_downscaled: {
    omitColumns: ['id'],
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  deployments: {
    priority: 1,
    serverSync: false,
    schema: 'public',
  },
  resource_collections: {
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  resource_files: {
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  resource_files_child: {
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  resource_links: {
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  translations: {
    serverSync: true,
    batchSize: 250,
    schema: 'public',
  },
  user_profiles: {
    serverSync: false,
    schema: 'public',
  },
  user_roles: {
    priority: 1,
    serverSync: false,
    schema: 'public',
  },
  // Geo schema tables
  countries: {
    serverSync: true,
    batchSize: 250,
    schema: 'geo',
  },
  locales: {
    serverSync: true,
    batchSize: 250,
    schema: 'geo',
  },
  boundaries: {
    serverSync: true,
    batchSize: 250,
    schema: 'geo',
  },
  // Budget schema tables
  budgets: {
    serverSync: true,
    batchSize: 250,
    schema: 'budget',
  },
  // Climate station data with filter for specific station
  climate_station_data: {
    serverSync: true,
    batchSize: 50,
    schema: 'public',
    filter: { country_code: 'zm', station_id: 'chipata_met' },
  },
};

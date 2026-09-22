import type { Database } from '../../supabase/types';

export interface ISeedDataConfiguration {
  /** Omit columns from CSV (e.g. if auto-populated from other columns) */
  omitColumns?: string[];
  /**
   * Specify higher priority if table should be imported ahead of others
   * Default behaviour prioritises tables with shorter names before longer
   * */
  priority?: 1;
  /** Batch size for paginated export (default: 250). Override per table if needed. */
  batchSize?: number;
  /** Database schema (default: 'public') */
  schema?: keyof Database;
  /**
   * Optional column-value filter for subset exports (e.g., { country_code: 'zm' }).
   * Array values match any entry (e.g., { station_id: ['zm/chipata_met', 'zm/petauke_met'] })
   */
  filter?: Record<string, string | number | boolean | (string | number | boolean)[]>;
}

/** Representative seed countries shared across country-scoped tables */
export const SEED_COUNTRIES = ['zm', 'mw', 'zw'];

/**
 * Representative seed stations shared across station-linked tables.
 * Values are composite ids (country_code || '/' || station_id), matching
 * climate_stations.id, climate_station_data.station_id and
 * crop_data_downscaled.station_id.
 */
export const SEED_STATION_IDS = [
  'zm/chipata_met',
  'zm/petauke_met',
  'mw/nkhotakota',
  'mw/kasungu',
  'zw/masvingo',
  'zw/plumtree',
];

type IDBTableName = string; // Allow any table name including cross-schema

/**
 * Single source of truth for seed tables, used for both local import and
 * remote export. Presence in this config means "sync from remote on export" -
 * local-first tables (deployments, user_profiles, user_roles) are intentionally
 * omitted so export never overwrites them (they are still seeded from local CSVs).
 */
export const SEED_DATA_CONFIGURATION: Record<IDBTableName, ISeedDataConfiguration> = {
  // Public schema tables
  climate_stations: {
    omitColumns: ['id'],
    schema: 'public',
    filter: { id: SEED_STATION_IDS },
  },
  climate_station_data: {
    batchSize: 50,
    schema: 'public',
    filter: { station_id: SEED_STATION_IDS },
  },
  crop_data: {
    omitColumns: ['id'],
    schema: 'public',
    filter: { country_code: SEED_COUNTRIES },
  },
  crop_data_downscaled: {
    omitColumns: ['id'],
    schema: 'public',
    filter: { station_id: SEED_STATION_IDS },
  },
  resource_collections: {
    schema: 'public',
  },
  resource_files: {
    schema: 'public',
  },
  resource_files_child: {
    schema: 'public',
  },
  resource_links: {
    schema: 'public',
  },
  translations: {
    schema: 'public',
  },
  // Geo schema tables
  countries: {
    schema: 'geo',
  },
  locales: {
    schema: 'geo',
  },
  boundaries: {
    schema: 'geo',
  },
  // Budget schema tables
  budgets: {
    schema: 'budget',
  },
};

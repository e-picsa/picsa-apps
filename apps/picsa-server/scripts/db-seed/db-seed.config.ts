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
   * Column(s) to sort by on export for deterministic CSV output (default: 'id').
   * Sorting happens server-side so it works even when the column itself is omitted.
   */
  orderBy?: string | string[];
  /**
   * Optional column-value filter for subset exports (e.g., { country_code: 'zm' }).
   * Array values match any entry (e.g., { station_id: ['zm/chipata_met', 'zm/petauke_met'] })
   */
  filter?: Record<string, string | number | boolean | (string | number | boolean)[]>;
}

/** Metadata columns stripped from every export (DB defaults repopulate on import) */
export const SEED_METADATA_COLUMNS = ['created_at', 'updated_at'];

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

/**
 * Single source of truth for seed tables, used for both local import and
 * remote export. Table names allow any schema (e.g. geo.countries resolve via
 * the per-entry `schema` field). Presence in this config means "sync from
 * remote on export" - local-first tables (deployments, user_profiles,
 * user_roles) are intentionally omitted so export never overwrites them
 * (they are still seeded from local CSVs).
 */
export const SEED_DATA_CONFIGURATION: Record<string, ISeedDataConfiguration> = {
  // Public schema tables
  climate_stations: {
    omitColumns: ['id'],
    schema: 'public',
    filter: { id: SEED_STATION_IDS },
  },
  climate_station_data: {
    batchSize: 50,
    schema: 'public',
    orderBy: 'station_id',
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
  // Geo schema tables (no single 'id' column - sort by primary key instead)
  countries: {
    schema: 'geo',
    orderBy: 'code',
  },
  locales: {
    schema: 'geo',
    orderBy: 'code',
  },
  boundaries: {
    schema: 'geo',
    orderBy: ['country_code', 'admin_level'],
  },
  // Budget schema tables
  budgets: {
    schema: 'budget',
  },
};

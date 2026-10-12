import type { Database } from '../../supabase/types';

export interface ISeedDataConfiguration {
  /** Omit columns from CSV / DB insert (e.g. if auto-populated from other columns) */
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
  /**
   * Column value overrides or transform functions applied during CSV import.
   * Supports static values (e.g. `{ cover_image: 'global/images/placeholder.svg', storage_file: null }`)\
   * or transform functions `(value: any, row: any) => any`.
   */
  columnMappings?: Record<string, any | ((value: any, row: any) => any)>;
}

/** Metadata columns stripped from every export (DB defaults repopulate on import) */
export const SEED_METADATA_COLUMNS = ['created_at', 'updated_at'];

/** Deterministic local seed admin user ID from seed.sql */
export const SEED_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000';

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
  'zw/masvingo_airport_met',
  'zw/plumtree_met',
];

/**
 * Base configuration for seed tables defining schemas, priorities, column mappings,
 * and sort orders.
 */
export const SEED_DATA_BASE: Record<string, ISeedDataConfiguration> = {
  // Public schema tables
  climate_stations: {
    priority: 1,
    omitColumns: ['id'],
  },
  climate_station_data: {
    batchSize: 50,
    orderBy: 'station_id',
  },
  crop_data: {
    omitColumns: ['id'],
  },
  crop_data_downscaled: {
    omitColumns: ['id'],
  },
  deployments: {
    priority: 1,
  },
  forecasts: {
    columnMappings: {
      storage_file: 'global/forecasts/sample_seasonal.pdf',
    },
  },
  resource_collections: {
    columnMappings: {
      owner: SEED_ADMIN_USER_ID,
    },
  },
  resource_files: {
    priority: 1,
    columnMappings: {
      cover_image: 'global/images/placeholder.svg',
      storage_file: null,
      owner: SEED_ADMIN_USER_ID,
    },
  },
  resource_files_child: {
    columnMappings: {
      cover_image: 'global/images/placeholder.svg',
      storage_file: null,
      owner: SEED_ADMIN_USER_ID,
    },
  },
  resource_links: {
    columnMappings: {
      owner: SEED_ADMIN_USER_ID,
    },
  },
  translations: {},
  // Geo schema tables (no single 'id' column - sort by primary key instead)
  countries: {
    schema: 'geo',
    orderBy: 'code',
    priority: 1,
  },
  locales: {
    schema: 'geo',
    orderBy: 'code',
    omitColumns: ['code'],
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

/**
 * Standard seed configuration: filters datasets down to a representative subset
 * for storage in repo CSVs (`supabase/data`).
 */
export const SEED_DATA_CONFIG: Record<string, ISeedDataConfiguration> = {
  ...SEED_DATA_BASE,
  climate_station_data: {
    ...SEED_DATA_BASE.climate_station_data,
    filter: { station_id: SEED_STATION_IDS },
  },
  forecasts: {
    ...SEED_DATA_BASE.forecasts,
    filter: { forecast_type: ['seasonal', 'downscaled'] },
  },
};

/**
 * Extended seed configuration: does not filter datasets, allowing a complete
 * clone/mirror of remote records directly into the local database.
 */
export const SEED_DATA_EXTENDED_CONFIG: Record<string, ISeedDataConfiguration> = {
  ...SEED_DATA_BASE,
  // Extended configuration does not apply filters, pulling all remote rows
};

/** Alias for backward compatibility */
export const SEED_DATA_CONFIGURATION = SEED_DATA_CONFIG;

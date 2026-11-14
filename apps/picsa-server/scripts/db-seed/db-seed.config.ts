import type { Database } from '../../supabase/types';

export interface ISeedDataConfiguration {
  /** Omit columns from CSV / DB insert (e.g. if auto-populated from other columns) */
  omitColumns?: string[];
  /**
   * Specify higher priority if table should be imported ahead of others
   * Default behaviour prioritises tables with shorter names before longer
   * */
  priority?: 1;
  /** Batch size for paginated export and local upsert chunks. Override per table if needed. */
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
   * Array values match any entry (e.g., { station_id: ['zm/chipata_met', 'zm/petauke_met'] }).
   * Operator objects support pattern matching and exclusion
   * (e.g., { country_code: { operator: 'neq', value: 'xx' } }).
   */
  filter?: Record<string, SeedFilterValue>;
  /**
   * Column value overrides or transform functions applied during CSV import.
   * Supports static values (e.g. `{ cover_image: 'global/images/placeholder.svg', storage_file: null }`)\
   * or transform functions `(value: any, row: any) => any`.
   */
  columnMappings?: Record<string, any | ((value: any, row: any) => any)>;
  /**
   * Columns holding `<bucket>/<path>` storage references whose files should be
   * mirrored from remote into local buckets during extended seed, ahead of row
   * upserts (satisfies storage foreign keys and keeps files downloadable offline).
   * Prefer over columnMappings rewrites, which silently corrupt file references.
   * Unmirrorable files warn and null the column so the import still succeeds.
   */
  mirrorStorage?: string[];
}

/** Filter value shapes understood by db-seed-export's query builder. */
export type SeedFilterValue =
  | string
  | number
  | boolean
  | (string | number | boolean)[]
  | { operator: 'like' | 'ilike'; value: string }
  | { operator: 'in'; value: (string | number | boolean)[] }
  | { operator: 'neq'; value: string | number | boolean };

/** Metadata columns stripped from every export (DB defaults repopulate on import) */
export const SEED_METADATA_COLUMNS = ['created_at', 'updated_at'];

/** Deterministic local seed admin user ID from seed.sql */
export const SEED_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Demo (`xx`) rows live in the TS baseline (`scripts/demo/baseline`), never in
 * committed seeds — a prod `demo:reset` would otherwise leak them into the
 * next export. Excluded from the CSV-export config below (extended mirrors
 * keep everything, and the chained `demo:reset` converges local state after).
 * An explicit `--country=xx` still overrides this and exports demo rows.
 */
export const EXCLUDE_DEMO_COUNTRY: Record<string, SeedFilterValue> = {
  country_code: { operator: 'neq', value: 'xx' },
};

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
    mirrorStorage: ['icon_path'],
  },
  // NOTE: no columnMappings here by design. A previous storage_file override
  // (sample PDF) silently rewrote every mirrored row's file path on import,
  // mislabelling all short-term forecasts as samples. Real paths are preserved
  // and missing files mirrored via mirrorStorage below.
  forecasts: {
    mirrorStorage: ['storage_file'],
  },
  resource_collections: {
    mirrorStorage: ['cover_image'],
    columnMappings: {
      owner: SEED_ADMIN_USER_ID,
    },
  },
  resource_files: {
    priority: 1,
    mirrorStorage: ['cover_image', 'storage_file'],
    columnMappings: {
      owner: SEED_ADMIN_USER_ID,
    },
  },
  resource_files_child: {
    mirrorStorage: ['cover_image', 'storage_file'],
    columnMappings: {
      owner: SEED_ADMIN_USER_ID,
    },
  },
  resource_links: {
    mirrorStorage: ['cover_image'],
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
 * Demo (`xx`) rows are excluded everywhere (see EXCLUDE_DEMO_COUNTRY) except
 * `climate_station_data`, whose inclusion list already covers only prod
 * stations. `translations` keeps all shared rows; only the demo-scoped
 * `xx_ny` column is omitted (single-sourced from the TS baseline instead).
 */
export const SEED_DATA_CONFIG: Record<string, ISeedDataConfiguration> = {
  ...SEED_DATA_BASE,
  climate_stations: {
    ...SEED_DATA_BASE.climate_stations,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  climate_station_data: {
    ...SEED_DATA_BASE.climate_station_data,
    filter: { station_id: SEED_STATION_IDS },
  },
  crop_data: {
    ...SEED_DATA_BASE.crop_data,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  crop_data_downscaled: {
    ...SEED_DATA_BASE.crop_data_downscaled,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  deployments: {
    ...SEED_DATA_BASE.deployments,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  forecasts: {
    ...SEED_DATA_BASE.forecasts,
    filter: { forecast_type: ['seasonal', 'downscaled'], ...EXCLUDE_DEMO_COUNTRY },
  },
  resource_collections: {
    ...SEED_DATA_BASE.resource_collections,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  resource_files: {
    ...SEED_DATA_BASE.resource_files,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  resource_files_child: {
    ...SEED_DATA_BASE.resource_files_child,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  resource_links: {
    ...SEED_DATA_BASE.resource_links,
    filter: { ...EXCLUDE_DEMO_COUNTRY },
  },
  translations: {
    ...SEED_DATA_BASE.translations,
    omitColumns: ['xx_ny'],
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

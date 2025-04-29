import type { Database } from '../../supabase/types';

export interface ISeedDataConfiguration {
  /** Omit columns from CSV (e.g. if auto-populated from other columns) */
  omitColumns?: string[];
}

type IDBTableName = keyof Database['public']['Tables'];

export const SEED_DATA_CONFIGURATION: Partial<Record<IDBTableName, ISeedDataConfiguration>> = {
  climate_stations: {
    omitColumns: ['id'],
  },
  crop_data: {
    omitColumns: ['id'],
  },
  crop_data_downscaled: {
    omitColumns: ['id'],
  },
};

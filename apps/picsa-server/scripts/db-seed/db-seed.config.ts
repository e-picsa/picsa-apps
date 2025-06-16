import type { Database } from '../../supabase/types';

export interface ISeedDataConfiguration {
  /** Omit columns from CSV (e.g. if auto-populated from other columns) */
  omitColumns?: string[];
  /**
   * Specify higher priority if table should be imported ahead of others
   * Default behaviour prioritises tables with shorter names before longer
   * */
  priority?: 1;
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
  deployments: {
    priority: 1,
  },
};

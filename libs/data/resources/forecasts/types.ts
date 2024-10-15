import type { Database } from '@picsa/server-types';

// TODO - use general storage entry
export type IForecastStorageEntry = Database['public']['Views']['storage_objects']['Row'];

export type IForecasts = { seasonal: IForecastStorageEntry[]; downscaled: IForecastStorageEntry[] };

import * as schema from './schema_v3';

// Re-export schema to provide latest version without need to refactor additonal code

export const FORECAST_COLLECTION = schema.COLLECTION_V3;
export const FORECAST_SCHEMA = schema.SCHEMA_V3;
export const SERVER_DB_MAPPING = schema.SERVER_DB_MAPPING_V3;

export type IForecast = schema.IForecast_V3;

import * as schema from './schema_v0';

// Re-export schema to provide latest version without need to refactor additonal code

export const CLIMATE_FORECAST_COLLECTION = schema.COLLECTION_V0;
export const CLIMATE_FORECAST_SCHEMA = schema.SCHEMA_V0;
export const SERVER_DB_MAPPING = schema.SERVER_DB_MAPPING_V0;

export type IClimateForecast = schema.IClimateForecast_V0;

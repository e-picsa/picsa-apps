import type * as ClimateApi from '../../types/climate-api.types';
import type { Database } from '../../types/db.types.ts';

// climate
export type climateApiPaths = ClimateApi.paths;
export type climateApiComponents = ClimateApi.components;

export type IDBClimateForecastRow = Database['public']['Tables']['forecasts']['Row'];
export type IDBClimateForecastInsert = Database['public']['Tables']['forecasts']['Insert'];

export type IApiClimateForecast = climateApiComponents['schemas']['DocumentMetadata'];

export type IForecastDBAPIResponse = {
  [country_code: string]: IDBClimateForecastInsert[];
};

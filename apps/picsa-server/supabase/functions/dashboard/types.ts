import type { Database } from '../../types/db.types.ts';
import type { paths, components } from '../../../../picsa-apps/dashboard/src/app/modules/climate/types/api.d.ts';

// climate
export type climateApiPaths = paths;
export type climateApiComponents = components;

export type IDBClimateForecastRow = Database['public']['Tables']['forecasts']['Row'];
export type IDBClimateForecastInsert = Database['public']['Tables']['forecasts']['Insert'];

export type IApiClimateForecast = climateApiComponents['schemas']['DocumentMetadata'];

export type IForecastDBAPIResponse = {
  [country_code: string]: IDBClimateForecastInsert[];
};

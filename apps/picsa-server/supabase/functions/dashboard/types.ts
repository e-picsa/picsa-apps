import type { Database } from '../../types/index.ts';
import type { paths, components } from '../../../../picsa-apps/dashboard/src/app/modules/climate/types/api.d.ts';

export type climateApiPaths = paths;
export type climateApiComponents = components;

export type IDBClimateForecastRow = Database['public']['Tables']['climate_forecasts']['Row'];
export type IDBClimateForecastInsert = Database['public']['Tables']['climate_forecasts']['Insert'];

export type IApiClimateForecast = climateApiComponents['schemas']['DocumentMetadata'];

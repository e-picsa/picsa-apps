// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';

export type IClimateProductRow = Database['public']['Tables']['climate_products']['Row'];
export type IClimateProductInsert = Database['public']['Tables']['climate_products']['Insert'];

export type IForecastRow = Database['public']['Tables']['climate_forecasts']['Row'];
export type IForecastInsert = Database['public']['Tables']['climate_forecasts']['Insert'];

export type IStationRow = Database['public']['Tables']['climate_stations']['Row'];
export type IStationInsert = Database['public']['Tables']['climate_stations']['Insert'];

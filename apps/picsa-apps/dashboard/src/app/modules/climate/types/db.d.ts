// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';

export type IForecastRow = Database['public']['Tables']['climate_forecasts']['Row'];

export type IResourceRow = Database['public']['Tables']['resources']['Row'];

export type IStationRow = Database['public']['Tables']['climate_stations']['Row'];

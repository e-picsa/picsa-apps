// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';

import type { components as API } from './api';

// DB types (with some merged api)
export type IClimateSummaryRainfallRow = Database['public']['Tables']['climate_summary_rainfall']['Row'] & {
  data: API['schemas']['AnnualRainfallSummariesdata'][];
  metadata: API['schemas']['AnnualRainfallSummariesMetadata'];
};
export type IClimateSummaryRainfallInsert = Database['public']['Tables']['climate_summary_rainfall']['Insert'];

export type IForecastRow = Database['public']['Tables']['climate_forecasts']['Row'];
export type IForecastInsert = Database['public']['Tables']['climate_forecasts']['Insert'];
export type IForecastUpdate = Database['public']['Tables']['climate_forecasts']['Update'];

export type IStationRow = Database['public']['Tables']['climate_stations']['Row'];
export type IStationInsert = Database['public']['Tables']['climate_stations']['Insert'];

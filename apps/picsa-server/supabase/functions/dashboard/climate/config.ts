import type * as ClimateApi from '../../../types/climate-api.types.ts';
import type { Database } from '../../../types/db.types.ts';

export type ClimateStationData = Database['public']['Tables']['climate_station_data']['Insert'];

/** Extract all paths from ClimateApi.paths that support POST */
export type ClimatePostPath = {
  [K in keyof ClimateApi.paths]: ClimateApi.paths[K] extends { post: any } ? K : never;
}[keyof ClimateApi.paths];

export interface StationSummaryConfig<P extends ClimatePostPath = ClimatePostPath> {
  endpoint: P;
  dataField: keyof ClimateStationData;
  metadataField: keyof ClimateStationData;
  endpointName: string;
  summaries?: readonly string[];
  maxRows?: number;
}

export const STATION_SUMMARY_CONFIGS = {
  'rainfall-summaries': {
    endpoint: '/v2/annual_rainfall_summaries/',
    dataField: 'annual_rainfall_data',
    metadataField: 'annual_rainfall_metadata',
    endpointName: 'rainfallSummaries',
    summaries: ['annual_rain', 'start_rains', 'end_rains', 'end_season', 'seasonal_rain', 'seasonal_length'],
    maxRows: 1000,
  },
  'annual-temperature': {
    endpoint: '/v2/annual_temperature_summaries/',
    dataField: 'annual_temperature_data',
    metadataField: 'annual_temperature_metadata',
    endpointName: 'annualTemperature',
    summaries: ['mean_tmin', 'mean_tmax', 'min_tmin', 'min_tmax', 'max_tmin', 'max_tmax'],
  },
  'crop-probabilities': {
    endpoint: '/v2/crop_success_probabilities/',
    dataField: 'crop_probability_data',
    metadataField: 'crop_probability_metadata',
    endpointName: 'cropProbabilities',
  },
  'monthly-temperatures': {
    endpoint: '/v2/monthly_temperature_summaries/',
    dataField: 'monthly_temperature_data',
    metadataField: 'monthly_temperature_metadata',
    endpointName: 'monthlyTemperatures',
  },
  'season-start': {
    endpoint: '/v2/season_start_probabilities/',
    dataField: 'season_start_data',
    metadataField: 'season_start_metadata',
    endpointName: 'seasonStart',
  },
} as const satisfies Record<string, StationSummaryConfig>;

export type StationSummaryAction = keyof typeof STATION_SUMMARY_CONFIGS;

export type ClimateAction = StationSummaryAction | 'update-stations' | 'forecast-file';

export const isStationSummaryAction = (action: string): action is StationSummaryAction => {
  return Object.hasOwn(STATION_SUMMARY_CONFIGS, action);
};

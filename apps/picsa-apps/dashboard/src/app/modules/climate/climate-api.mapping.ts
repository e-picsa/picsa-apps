import type { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateService } from './climate.service';
import { IForecastRow, IStationRow } from './types';

export type IApiMapping = ReturnType<typeof ApiMapping>;
export type IApiMappingName = keyof IApiMapping;
export type ApiParams<T extends IApiMappingName> = Parameters<IApiMapping[T]>[0];

export type ApiRequest<T extends IApiMappingName = IApiMappingName> = {
  [K in T]: {
    endpoint: K;
    params: ApiParams<K>;
  };
}[T];

/**
 * Mapping functions that handle processing of data loaded from API server endpoints,
 * and populating entries to supabase DB
 */
export const ApiMapping = (service: ClimateService, supabaseService: SupabaseService) => {
  return {
    /**
     * /v1/annual_rainfall_summaries/
     * stored to columns in `climate_station_data` table
     */
    rainfallSummaries: async (station: IStationRow) => {
      const { country_code } = station;
      return supabaseService.invokeFunction(`dashboard/climate/rainfall-summaries`, {
        body: { station, country_code },
      });
    },

    /**
     * /v1/annual_temperature_summaries/
     * stored to columns in `climate_station_data` table
     */
    annualTemperature: async (station: IStationRow) => {
      const { country_code } = station;
      return supabaseService.invokeFunction(`dashboard/climate/annual-temperature`, {
        body: { station, country_code },
      });
    },

    /**
     * /v1/crop_success_probabilities/
     * stored to columns in `climate_station_data` table
     */
    cropProbabilities: async (station: IStationRow) => {
      const { country_code } = station;
      return supabaseService.invokeFunction(`dashboard/climate/crop-probabilities`, {
        body: { station, country_code },
      });
    },

    /**
     * /v1/monthly_temperature_summaries/
     * stored to columns in `climate_station_data` table
     */
    monthlyTemperatures: async (station: IStationRow) => {
      const { country_code } = station;
      return supabaseService.invokeFunction(`dashboard/climate/monthly-temperatures`, {
        body: { station, country_code },
      });
    },

    /**
     * /v1/season_start_probabilities/
     * stored to columns in `climate_station_data` table
     */
    seasonStart: async (station: IStationRow) => {
      const { country_code } = station;
      return supabaseService.invokeFunction(`dashboard/climate/season-start`, {
        body: { station, country_code },
      });
    },

    /**
     * /v1/extremes_summaries/
     * stored to columns in `climate_station_data` table
     */
    extremes: async (station: IStationRow) => {
      const { country_code } = station;
      return supabaseService.invokeFunction(`dashboard/climate/extremes`, {
        body: { station, country_code },
      });
    },

    /**
     * /v1/station/{country}
     */
    station: async (country_code: string) => {
      const dbData = await supabaseService.invokeFunction<IStationRow[]>(`dashboard/climate/update-stations`, {
        body: { country_code },
      });
      if (dbData && dbData.length > 0) {
        service.stations.set(dbData);
      }
    },

    /**
     *
     * @param row
     * @returns
     */
    forecast_file: async (row: IForecastRow) => {
      const res = await supabaseService.invokeFunction<{ fullPath: string }>(`dashboard/climate/forecast-file`, {
        body: { row },
      });
      if (!res) {
        throw new Error('Failed to retrieve forecast file: Service unavailable');
      }
      return res.fullPath;
    },
  };
};

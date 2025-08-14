import type { SupabaseService } from '@picsa/shared/services/core/supabase';
import { SupabaseStorageService } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { ClimateService } from './climate.service';
import type { ClimateApiService } from './climate-api.service';
import { IForecastRow, IForecastUpdate, IStationInsert, IStationRow } from './types';

export type IApiMapping = ReturnType<typeof ApiMapping>;
export type IApiMappingName = keyof IApiMapping;

// TODO - certain amount of boilerplate could be reduced
// TODO - depends on climate api updates
// TODO - most of these should be run on server as server functions

/**
 * Mapping functions that handle processing of data loaded from API server endpoints,
 * and populating entries to supabase DB
 */
export const ApiMapping = (
  api: ClimateApiService,
  service: ClimateService,
  supabaseService: SupabaseService,
  storage: SupabaseStorageService,
) => {
  return {
    /**
     * /v1/annual_rainfall_summaries/
     * stored to columns in `climate_station_data` table
     */
    rainfallSummaries: async (station: IStationRow) => {
      const { country_code, station_id, station_name, id } = station;
      // TODO - add model type definitions for server rainfall summary response body
      const { data: apiData, error } = await api
        .getObservableClient(`rainfallSummary_${id}`)
        .POST('/v1/annual_rainfall_summaries/', {
          body: {
            country: `${country_code}` as any,
            // HACK - API uses the value stored as station_name (instead of sanitized id)
            // TODO - Push for api to use safer ID values
            station_id: `${station_name}`,
            summaries: ['annual_rain', 'start_rains', 'end_rains', 'end_season', 'seasonal_rain', 'seasonal_length'],
          },
        });
      if (error) throw error;
      // HACK - API issue returning huge data for some stations
      if (apiData.data.length > 1000) {
        console.error({ country_code, station_id, station_name, total_rows: apiData.data.length });
        throw new Error(`[rainfallSummary] Too many rows | ${station_name} ${apiData.data.length}`);
      }

      const { error: upsertError } = await service.updateStationData(station, {
        annual_rainfall_data: apiData.data as any[],
        annual_rainfall_metadata: apiData.metadata,
      });
      if (upsertError) throw upsertError;
      return apiData;
    },

    /**
     * /v1/annual_temperature_summaries/
     * stored to columns in `climate_station_data` table
     */
    annualTemperature: async (station: IStationRow) => {
      const { country_code, station_id, station_name, id } = station;
      // TODO - add model type definitions for server rainfall summary response body
      const { data: apiData, error } = await api
        .getObservableClient(`annualTemperature_${id}`)
        .POST('/v1/annual_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
            summaries: ['mean_tmin', 'mean_tmax', 'min_tmin', 'min_tmax', 'max_tmin', 'max_tmax'],
          },
        });
      if (error) throw error;
      // HACK - API issue returning huge data for some stations
      const { error: upsertError } = await service.updateStationData(station, {
        annual_temperature_data: apiData.data as any[],
        annual_temperature_metadata: apiData.metadata,
      });
      if (upsertError) throw upsertError;
      return apiData;
    },

    /**
     * /v1/crop_success_probabilities/
     * stored to columns in `climate_station_data` table
     */
    cropProbabilities: async (station: IStationRow) => {
      const { country_code, station_name, id } = station;
      const { data: apiData, error } = await api
        .getObservableClient(`cropProbabilities_${id}`)
        .POST('/v1/crop_success_probabilities/', {
          body: {
            country: `${country_code}` as any,
            // HACK - API uses the value stored as station_name (instead of sanitized id)
            // TODO - Push for api to use safer ID values
            station_id: `${station_name}`,
          },
        });
      if (error) throw error;

      // TODO - filter here?
      // data.filter((v) => v.prop_success_no_start > 0)

      const { error: upsertError } = await service.updateStationData(station, {
        crop_probability_data: apiData.data as any[],
        crop_probability_metadata: apiData.metadata,
      });
      if (upsertError) throw upsertError;
      return apiData;
    },

    /**
     * /v1/monthly_temperature_summaries/
     * stored to columns in `climate_station_data` table
     */
    monthlyTemperatures: async (station: IStationRow) => {
      const { country_code, station_name, id } = station;
      const { data: apiData, error } = await api
        .getObservableClient(`monthlyTemperatures_${id}`)
        .POST('/v1/monthly_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            // HACK - API uses the value stored as station_name (instead of sanitized id)
            // TODO - Push for api to use safer ID values
            station_id: `${station_name}`,
          },
        });
      if (error) throw error;

      const { error: upsertError } = await service.updateStationData(station, {
        monthly_temperature_data: apiData.data as any[],
        monthly_temperature_metadata: apiData.metadata,
      });
      if (upsertError) throw upsertError;
      return apiData;
    },

    /**
     * /v1/season_start_probabilities/
     * stored to columns in `climate_station_data` table
     */
    seasonStart: async (station: IStationRow) => {
      const { country_code, station_name, id } = station;
      const { data: apiData, error } = await api
        .getObservableClient(`seasonStart_${id}`)
        .POST('/v1/season_start_probabilities/', {
          body: {
            country: `${country_code}` as any,
            // HACK - API uses the value stored as station_name (instead of sanitized id)
            // TODO - Push for api to use safer ID values
            station_id: `${station_name}`,
          },
        });
      if (error) throw error;

      const { error: upsertError } = await service.updateStationData(station, {
        season_start_data: apiData.data as any[],
        season_start_metadata: apiData.metadata,
      });
      if (upsertError) throw upsertError;
      return apiData;
    },

    /**
     * /v1/extremes_summaries/
     * stored to columns in `climate_station_data` table
     */
    extremes: async (station: IStationRow) => {
      const { country_code, station_name, id } = station;
      const { data: apiData, error } = await api.getObservableClient(`extremes_${id}`).POST('/v1/extremes_summaries/', {
        body: {
          country: `${country_code}` as any,
          // HACK - API uses the value stored as station_name (instead of sanitized id)
          // TODO - Push for api to use safer ID values
          station_id: `${station_name}`,
        },
      });
      if (error) throw error;

      const { error: upsertError } = await service.updateStationData(station, {
        extremes_data: apiData.data as any[],
        extremes_metadata: apiData.metadata,
      });
      if (upsertError) throw upsertError;
      return apiData;
    },

    /**
     * /v1/station/{country}
     */
    station: async (country_code: string) => {
      const { data, error } = await api
        .getObservableClient('station')
        .GET(`/v1/station/{country}`, { params: { path: { country: country_code as any } } });
      if (error) throw error;
      console.log('station data', data);
      const update = data.data.map(
        (d): IStationInsert => ({
          ...d,
          // HACK - clean IDs as currently just free text input
          // TODO - Push for api to use safer ID values
          station_id: `${d.station_id.toLowerCase().replace(/[^a-z]/gi, '_')}`,
        }),
      );
      const { error: dbError, data: dbData } = await supabaseService.db
        .table('climate_stations')
        .upsert<IStationInsert>(update)
        .select();
      if (dbError) throw dbError;
      if (dbData?.length > 0) {
        service.stations.set(dbData);
      }
    },

    /**
     *
     * @param row
     * @returns
     */
    forecast_file: async (row: IForecastRow) => {
      const { country_code, id } = row;
      // api does not use per-country buckets, so recreate folder structure from id
      const filepath = id.replace(`${country_code}/`, '');
      const { data, error } = await api
        .getObservableClient(`forecasts/${id}`)
        .GET(`/v1/documents/{country}/{filepath}`, {
          params: { path: { country: country_code as any, filepath } },
          parseAs: 'blob',
        });

      if (error) throw error;
      // setup metadata
      const fileBlob = data as any as Blob;
      const bucketId = country_code as string;
      const folderPath = 'forecasts/daily';
      // upload to storage
      const { fullPath } = await storage.putFile({ bucketId, fileBlob, filename: filepath, folderPath });

      // TODO - handle error if filename already exists
      const { error: dbError } = await supabaseService.db
        .table('forecasts')
        .update<IForecastUpdate>({ storage_file: fullPath })
        .eq('id', row.id);
      if (dbError) {
        throw dbError;
      }
      return fullPath;
    },
  };
};

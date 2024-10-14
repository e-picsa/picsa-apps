import type { SupabaseService } from '@picsa/shared/services/core/supabase';
import { SupabaseStorageService } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { IDeploymentRow } from '../deployment/types';
import { ClimateService } from './climate.service';
import type { ClimateApiService } from './climate-api.service';
import {
  IAPICountryCode,
  IClimateSummaryRainfallInsert,
  IClimateSummaryRainfallRow,
  IForecastInsert,
  IForecastRow,
  IStationInsert,
  IStationRow,
} from './types';

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
  db: SupabaseService['db'],
  storage: SupabaseStorageService,
  deployment: IDeploymentRow
) => {
  return {
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
      const { data, metadata } = apiData;
      if (data.length > 1000) {
        console.error({ country_code, station_id, station_name, total_rows: data.length });
        throw new Error(`[rainfallSummary] Too many rows | ${station_name} ${data.length}`);
      }
      // TODO - gen types and handle mapping
      const entry: IClimateSummaryRainfallInsert = {
        data: data as any[],
        metadata,
        station_id: id as string,
        country_code: country_code as any,
      };
      const { data: dbData, error: dbError } = await db
        .table('climate_summary_rainfall')
        .upsert<IClimateSummaryRainfallInsert>(entry)
        .select<'*', IClimateSummaryRainfallRow>('*');
      if (dbError) throw dbError;
      return dbData || [];
    },
    //
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
        })
      );
      const { error: dbError, data: dbData } = await db
        .table('climate_stations')
        .upsert<IStationInsert>(update)
        .select();
      if (dbError) throw dbError;
      if (dbData?.length > 0) {
        service.stations.set(dbData);
      }
    },
    //
    forecasts: async (country_code: IAPICountryCode) => {
      // const { data, error } = await api
      //   .getObservableClient(`forecasts/${country_code}`)
      //   .GET(`/v1/forecasts/{country_code}`, { params: { path: { country_code } } });
      // if (error) throw error;
      // const forecasts = data.map((d): IForecastInsert => {
      //   const { date, filename, format, type } = d;
      //   // TODO - handle format
      //   return { date_modified: date, filename, country_code, type, id: filename.split('/').pop() as string };
      // });
      // const { error: dbError, data: dbData } = await db
      //   .table('climate_forecasts')
      //   .upsert<IForecastInsert>(forecasts)
      //   .select<'*', IForecastRow>('*');
      // if (dbError) throw dbError;
      // return dbData || [];
      return [];
    },
    forecast_file: async (row: IForecastRow) => {
      // const { country_code, filename } = row;
      // const { data, error } = await api.getObservableClient(`forecasts/${filename}`).GET(`/v1/forecasts/{file_name}`, {
      //   params: { path: { file_name: filename } },
      //   parseAs: 'blob',
      // });
      // if (error) throw error;
      // // setup metadata
      // const fileBlob = data as Blob;
      // const bucketId = country_code as string;
      // const folderPath = 'climate/forecasts';
      // // upload to storage
      // await storage.putFile({ bucketId, fileBlob, filename, folderPath });
      // // TODO - handle error if filename already exists
      // const storageEntry = await storage.getFileAlt({ bucketId, filename, folderPath });
      // if (storageEntry) {
      //   const { error: dbError } = await db
      //     .table('climate_forecasts')
      //     .upsert<IForecastInsert>({ ...row, storage_file: storageEntry.id })
      //     .select('*');
      //   if (dbError) {
      //     throw dbError;
      //   }
      //   return;
      // }
      // throw new Error('Storage file not found');
    },
  };
};

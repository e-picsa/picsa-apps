import type { SupabaseService } from '@picsa/shared/services/core/supabase';
import { SupabaseStorageService } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import type { ClimateApiService } from './climate-api.service';
import { IClimateProductInsert, IClimateProductRow, IForecastInsert, IForecastRow, IStationRow } from './types';

export type IApiMapping = ReturnType<typeof ApiMapping>;
export type IApiMappingName = keyof IApiMapping;

// TODO - certain amount of boilerplate could be reduced
// TODO - depends on climate api updates
// TODO - most of these should be run on server as server functions

/**
 * Mapping functions that handle processing of data loaded from API server endpoints,
 * and populating entries to supabase DB
 */
export const ApiMapping = (api: ClimateApiService, db: SupabaseService['db'], storage: SupabaseStorageService) => {
  return {
    rainfallSummaries: async (country_code: string, station_id: number) => {
      // TODO - add model type definitions for server rainfall summary response body
      const { data, error } = await api
        .getObservableClient(`rainfallSummary_${country_code}_${station_id}`)
        .POST('/v1/annual_rainfall_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_id}`,
            summaries: ['annual_rain', 'start_rains', 'end_rains', 'end_season', 'seasonal_rain', 'seasonal_length'],
          },
        });
      if (error) throw error;
      console.log('summary data', data);
      // TODO - gen types and handle mapping
      const mappedData = data as any;
      const { data: dbData, error: dbError } = await db
        .table('climate_products')
        .upsert<IClimateProductInsert>({
          data: mappedData,
          station_id,
          type: 'rainfallSummary',
        })
        .select<'*', IClimateProductRow>('*');
      if (dbError) throw dbError;
      return dbData || [];
    },
    //
    station: async () => {
      const { data, error } = await api.getObservableClient('station').GET('/v1/station/');
      if (error) throw error;
      // TODO - fix climate api bindigns to avoid data.data
      console.log('station data', data);
      const dbData = data.map(
        (d): IStationRow => ({
          ...d,
        })
      );
      const { error: dbError } = await db.table('climate_stations').upsert<IStationRow>(dbData);
      if (dbError) throw dbError;
      return dbData;
    },
    //
    forecasts: async (country_code: 'zm' | 'mw') => {
      const { data, error } = await api
        .getObservableClient(`forecasts/${country_code}`)
        .GET(`/v1/forecasts/{country_code}`, { params: { path: { country_code } } });
      if (error) throw error;
      const forecasts = data.map((d): IForecastInsert => ({ ...d, country_code }));
      const { error: dbError, data: dbData } = await db
        .table('climate_forecasts')
        .upsert<IForecastInsert>(forecasts)
        .select<'*', IForecastRow>('*');
      if (dbError) throw dbError;
      return dbData || [];
    },
    forecast_file: async (row: IForecastRow) => {
      const { country_code, filename } = row;
      const { data, error } = await api
        .getObservableClient(`forecasts/${filename}`)
        .GET(`/v1/forecasts/{country_code}/{file_name}`, {
          params: { path: { country_code: country_code as any, file_name: filename } },
          parseAs: 'blob',
        });
      if (error) throw error;
      // setup metadata
      const fileBlob = data as Blob;
      const bucketId = country_code as string;
      const folderPath = 'climate/forecasts';
      // upload to storage
      await storage.putFile({ bucketId, fileBlob, filename, folderPath });
      // TODO - handle error if filename already exists
      const storageEntry = await storage.getFile({ bucketId, filename, folderPath });
      if (storageEntry) {
        const { error: dbError } = await db
          .table('climate_forecasts')
          .upsert<IForecastInsert>({ ...row, storage_file: storageEntry.id })
          .select('*');
        if (dbError) {
          throw dbError;
        }
        return;
      }
      throw new Error('Storage file not found');
    },
  };
};

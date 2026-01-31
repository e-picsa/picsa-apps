import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import createClient from 'openapi-fetch';
import type * as ClimateApi from '../../../types/climate-api.types.ts';

const API_ENDPOINT = 'https://api.epicsa.idems.international';

// Create typed client
const apiClient = createClient<ClimateApi.paths>({
  baseUrl: API_ENDPOINT,
  headers: { 'Content-Type': 'application/json' },
});

export const climate = async (req: Request) => {
  const { pathname } = new URL(req.url);
  // Expected URL: /dashboard/climate/{action}
  // Remove prefix /dashboard/climate/ to get action
  const action = pathname.replace('/dashboard/climate/', '');
  console.log(`Climate action: ${action}`);

  const supabase = getServiceRoleClient();
  const payload = await req.json().catch(() => ({}));

  // Common payload destructuring, mostly used across endpoints
  const { station, country_code } = payload;

  try {
    switch (action) {
      case 'rainfall-summaries': {
        const { station_name, id } = station;
        // Type-safe POST request
        const { data: apiData, error: apiError } = await apiClient.POST('/v1/annual_rainfall_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
            summaries: ['annual_rain', 'start_rains', 'end_rains', 'end_season', 'seasonal_rain', 'seasonal_length'],
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        // HACK - API issue returning huge data for some stations
        if (apiData.data && apiData.data.length > 1000) {
          console.error({ country_code, station_id: id, station_name, total_rows: apiData.data.length });
          return ErrorResponse(`[rainfallSummary] Too many rows | ${station_name} ${apiData.data.length}`, 400);
        }

        const { error } = await supabase.from('climate_station_data').upsert({
          country_code: station.country_code,
          station_id: station.id,
          annual_rainfall_data: apiData.data,
          annual_rainfall_metadata: apiData.metadata,
        });

        if (error) throw error;
        return JSONResponse(apiData);
      }

      case 'annual-temperature': {
        const { station_name } = station;
        const { data: apiData, error: apiError } = await apiClient.POST('/v1/annual_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
            summaries: ['mean_tmin', 'mean_tmax', 'min_tmin', 'min_tmax', 'max_tmin', 'max_tmax'],
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        const { error } = await supabase.from('climate_station_data').upsert({
          country_code: station.country_code,
          station_id: station.id,
          annual_temperature_data: apiData.data,
          annual_temperature_metadata: apiData.metadata,
        });

        if (error) throw error;
        return JSONResponse(apiData);
      }

      case 'crop-probabilities': {
        const { station_name } = station;
        const { data: apiData, error: apiError } = await apiClient.POST('/v1/crop_success_probabilities/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        const { error } = await supabase.from('climate_station_data').upsert({
          country_code: station.country_code,
          station_id: station.id,
          crop_probability_data: apiData.data,
          crop_probability_metadata: apiData.metadata,
        });

        if (error) throw error;
        return JSONResponse(apiData);
      }

      case 'monthly-temperatures': {
        const { station_name } = station;
        const { data: apiData, error: apiError } = await apiClient.POST('/v1/monthly_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        const { error } = await supabase.from('climate_station_data').upsert({
          country_code: station.country_code,
          station_id: station.id,
          monthly_temperature_data: apiData.data,
          monthly_temperature_metadata: apiData.metadata,
        });

        if (error) throw error;
        return JSONResponse(apiData);
      }

      // case 'season-start': // Not currently enabled in frontend service comments?
      // Keeping disabled or uncommenting if needed? The user code had it commented out.
      // I will implement it but leave it commented out if I was strictly following,
      // but to be "robust" I can just leave it available if called.
      // But the frontend has it commented out.

      // case 'extremes': // also commented out in frontend

      case 'update-stations': {
        // This replaces 'station' in ApiMapping
        // GET /v1/station/{country}
        // Payload expects 'country_code'
        const targetCountry = payload.country_code;
        const { data, error: apiError } = await apiClient.GET(`/v1/station/{country}`, {
          params: { path: { country: targetCountry as any } },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);
        console.log('station data', data);

        const update = data.data.map((d: any) => ({
          ...d,
          station_id: `${d.station_id.toLowerCase().replace(/[^a-z]/gi, '_')}`,
        }));

        // Filter duplicates
        const unique = Object.values(
          update.reduce((acc: any, current: any) => {
            acc[current.station_id] = current;
            return acc;
          }, {}),
        );

        const { error, data: dbData } = await supabase.from('climate_stations').upsert(unique).select();

        if (error) throw error;
        return JSONResponse(dbData);
      }

      case 'forecast-file': {
        const { row } = payload;
        const { country_code, id } = row;
        const filepath = id.replace(`${country_code}/`, '');

        // Get file from API
        // Note: using fetch directly for binary data
        // openapi-fetch parseAs='blob' support might vary by version or need specific handling
        // But essentially we need raw blob.
        // The standard client might try to parse JSON.
        // Using raw fetch for file download is often safer/simpler if types aren't critical for the binary response.
        // But let's try to use the client if possible or fall back to fetch only for this one if needed.
        // openapi-fetch v0.8+ supports `parseAs: 'blob'` in the options?
        // Checking docs or assumption: libraries like this usually support it.
        // If not standard in the type definition, we might need a cast or just use fetch for this one case.
        // I will use fetch for file download to be safe and avoid type issues with blob parsing in the library wrapper
        // as user specifically asked for type safety on the API request side which is most valuable for the JSON endpoints.

        const response = await fetch(`${API_ENDPOINT}/v1/documents/${country_code}/${filepath}`, {
          method: 'GET',
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const fileBlob = await response.blob();

        // Upload to storage
        const bucketId = country_code;
        const folderPath = 'forecasts/daily';
        const storagePath = `${folderPath}/${filepath}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketId)
          .upload(storagePath, fileBlob, {
            upsert: true,
            contentType: response.headers.get('content-type') || 'application/octet-stream',
          });

        if (uploadError) throw uploadError;

        // Update DB
        const { error: dbError } = await supabase
          .from('forecasts')
          .update({ storage_file: uploadData.fullPath })
          .eq('id', id);

        if (dbError) throw dbError;

        return JSONResponse({ fullPath: uploadData.fullPath });
      }

      default:
        return ErrorResponse(`Invalid climate action: ${action}`, 400);
    }
  } catch (err: any) {
    console.error(err);
    return ErrorResponse(err.message || 'Internal Server Error', 500);
  }
};

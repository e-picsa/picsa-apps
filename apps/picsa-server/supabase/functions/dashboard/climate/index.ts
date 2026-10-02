import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import createClient from 'openapi-fetch';
import type * as ClimateApi from '../../../types/climate-api.types.ts';

const API_ENDPOINT = Deno.env.get('CLIMATE_API_ENDPOINT') || 'https://api.epicsa.idems.international';

// Create typed client for v2
const apiClient = createClient<ClimateApi.paths>({
  baseUrl: API_ENDPOINT,
  headers: { 'Content-Type': 'application/json' },
});

export const climate = async (req: Request) => {
  const { pathname } = new URL(req.url);
  // Expected URL: /dashboard/climate/{action}
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
        const { data: apiData, error: apiError } = await apiClient.POST('/v2/annual_rainfall_summaries/', {
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

        // Avoid overwriting existing data if API returned empty array
        if (!apiData.data || apiData.data.length === 0) {
          console.warn(
            `[rainfallSummary] No data returned for ${station_name} (${country_code}), preserving existing data.`,
          );
          return JSONResponse(apiData);
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
        const { data: apiData, error: apiError } = await apiClient.POST('/v2/annual_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
            summaries: ['mean_tmin', 'mean_tmax', 'min_tmin', 'min_tmax', 'max_tmin', 'max_tmax'],
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        if (!apiData.data || apiData.data.length === 0) {
          console.warn(
            `[annualTemperature] No data returned for ${station_name} (${country_code}), preserving existing data.`,
          );
          return JSONResponse(apiData);
        }

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
        const { data: apiData, error: apiError } = await apiClient.POST('/v2/crop_success_probabilities/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        if (!apiData.data || apiData.data.length === 0) {
          console.warn(
            `[cropProbabilities] No data returned for ${station_name} (${country_code}), preserving existing data.`,
          );
          return JSONResponse(apiData);
        }

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
        const { data: apiData, error: apiError } = await apiClient.POST('/v2/monthly_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        if (!apiData.data || apiData.data.length === 0) {
          console.warn(
            `[monthlyTemperatures] No data returned for ${station_name} (${country_code}), preserving existing data.`,
          );
          return JSONResponse(apiData);
        }

        const { error } = await supabase.from('climate_station_data').upsert({
          country_code: station.country_code,
          station_id: station.id,
          monthly_temperature_data: apiData.data,
          monthly_temperature_metadata: apiData.metadata,
        });

        if (error) throw error;
        return JSONResponse(apiData);
      }

      case 'season-start': {
        const { station_name } = station;
        const { data: apiData, error: apiError } = await apiClient.POST('/v2/season_start_probabilities/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station_name}`,
          },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        if (!apiData.data || apiData.data.length === 0) {
          return JSONResponse(apiData);
        }

        const { error } = await supabase.from('climate_station_data').upsert({
          country_code: station.country_code,
          station_id: station.id,
          season_start_data: apiData.data,
          season_start_metadata: apiData.metadata,
        });

        if (error) throw error;
        return JSONResponse(apiData);
      }

      case 'update-stations': {
        const targetCountry = payload.country_code?.toLowerCase();
        const { data, error: apiError } = await apiClient.GET('/v2/station/{country}', {
          params: { path: { country: targetCountry as any } },
        });

        if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

        const rawStations = data?.data || [];
        console.log(`Fetched ${rawStations.length} raw stations for ${targetCountry}`);

        if (rawStations.length === 0) {
          console.log(`No stations returned on /v2 for ${targetCountry}, preserving existing records.`);
          return JSONResponse([]);
        }

        // 1. Identify met/national station IDs (numeric IDs like MSD Zimbabwe WMO codes)
        // and Climsoft legacy station codes (e.g. CHIPAT01 for CHIPATA MET)
        const metStationIdMap = new Map<string, string>();
        for (const d of rawStations) {
          if (!d.station_id || !d.station_name) continue;
          if (/^\d+$/.test(d.station_id)) {
            metStationIdMap.set(d.station_name, d.station_id);
          } else if (d.station_id !== d.station_name && /^[A-Za-z]{5,7}\d{1,3}$/.test(d.station_id)) {
            metStationIdMap.set(d.station_name, d.station_id);
          }
        }

        // 2. Fetch existing DB station records for country to preserve existing non-null districts and met_station_ids
        const { data: existingStations } = await supabase
          .from('climate_stations')
          .select('station_id, district, met_station_id')
          .eq('country_code', targetCountry);

        const existingDistrictMap = new Map<string, string>();
        const existingMetIdMap = new Map<string, string>();
        for (const s of existingStations || []) {
          if (s.district) existingDistrictMap.set(s.station_id, s.district);
          if (s.met_station_id) existingMetIdMap.set(s.station_id, s.met_station_id);
        }

        // 3. Helper for clean station slugification
        const toCleanSlug = (str: string) =>
          str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');

        // 4. Filter out numeric entries, Climsoft code duplicates, and redundant AWS duplicates
        const candidateStations = rawStations.filter((d: any) => {
          if (!d.station_id) return false;
          // Filter out numeric station IDs (e.g. 67991020)
          if (/^\d+$/.test(d.station_id)) return false;
          // Filter out 8-character Climsoft codes if canonical station exists
          if (
            d.station_id !== d.station_name &&
            /^[A-Za-z]{5,7}\d{1,3}$/.test(d.station_id) &&
            rawStations.some((other: any) => other.station_id === d.station_name)
          ) {
            return false;
          }
          // Filter out redundant AWS duplicate stations (e.g. CHIPATA MET AWS)
          if (d.station_id.endsWith(' AWS')) {
            const baseName = d.station_id.replace(/\s+AWS$/, '');
            const baseNamePort = baseName.replace(/AIRPORT$/, 'AIRPOR');
            if (rawStations.some((other: any) => other.station_id === baseName || other.station_id === baseNamePort)) {
              return false;
            }
          }
          return true;
        });

        // 5. Build station rows: preserve existing non-null DB district and met_station_id
        const update = candidateStations.map((d: any) => {
          const slug = toCleanSlug(d.station_id);

          // Preserve existing DB district if present; do not override with upstream null
          const district = existingDistrictMap.get(slug) || d.district || null;

          // Resolve met_station_id: mapped WMO/Climsoft ID -> existing DB ID -> upstream ID
          const metStationId =
            metStationIdMap.get(d.station_name) || existingMetIdMap.get(slug) || d.met_station_id || null;

          return {
            station_id: slug,
            country_code: targetCountry,
            station_name: d.station_name,
            latitude: d.latitude,
            longitude: d.longitude,
            elevation: d.elevation,
            district,
            met_station_id: metStationId,
          };
        });

        // 6. Deduplicate by station_id
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

        const response = await fetch(`${API_ENDPOINT}/v2/documents/${country_code}/${filepath}`, {
          method: 'GET',
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const fileBlob = await response.blob();

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

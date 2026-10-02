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

interface SummaryApiResponse {
  data?: any[];
  metadata?: any;
}

const upsertStationSummary = async (
  supabase: ReturnType<typeof getServiceRoleClient>,
  station: { id: string; country_code: string; station_name?: string },
  apiResult: { data?: SummaryApiResponse; error?: any },
  dataField: string,
  metadataField: string,
  endpointName: string,
) => {
  const { data: apiData, error: apiError } = apiResult;
  if (apiError) throw new Error(`API Error: ${JSON.stringify(apiError)}`);

  if (!apiData?.data || apiData.data.length === 0) {
    console.warn(
      `[${endpointName}] No data returned for ${station.station_name} (${station.country_code}), preserving existing data.`,
    );
    return JSONResponse(apiData);
  }

  const { error } = await supabase.from('climate_station_data').upsert({
    country_code: station.country_code,
    station_id: station.id,
    [dataField]: apiData.data,
    [metadataField]: apiData.metadata,
  });

  if (error) throw error;
  return JSONResponse(apiData);
};

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
        const res = await apiClient.POST('/v2/annual_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station.station_name}`,
            summaries: ['mean_tmin', 'mean_tmax', 'min_tmin', 'min_tmax', 'max_tmin', 'max_tmax'],
          },
        });
        return upsertStationSummary(
          supabase,
          station,
          res,
          'annual_temperature_data',
          'annual_temperature_metadata',
          'annualTemperature',
        );
      }

      case 'crop-probabilities': {
        const res = await apiClient.POST('/v2/crop_success_probabilities/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station.station_name}`,
          },
        });
        return upsertStationSummary(
          supabase,
          station,
          res,
          'crop_probability_data',
          'crop_probability_metadata',
          'cropProbabilities',
        );
      }

      case 'monthly-temperatures': {
        const res = await apiClient.POST('/v2/monthly_temperature_summaries/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station.station_name}`,
          },
        });
        return upsertStationSummary(
          supabase,
          station,
          res,
          'monthly_temperature_data',
          'monthly_temperature_metadata',
          'monthlyTemperatures',
        );
      }

      case 'season-start': {
        const res = await apiClient.POST('/v2/season_start_probabilities/', {
          body: {
            country: `${country_code}` as any,
            station_id: `${station.station_name}`,
          },
        });
        return upsertStationSummary(
          supabase,
          station,
          res,
          'season_start_data',
          'season_start_metadata',
          'seasonStart',
        );
      }

      // Sync station records from upstream API (/v2/station/{country}).
      // Applies deduplication, WMO mapping, and non-destructive preservation of DB districts and coordinates.
      // @see apps/picsa-tools/climate-tool/src/app/data/stations/CLIMATE_API_ANOMALIES.md for documented upstream issues.
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

        // 2. Fetch existing DB station records for country to preserve existing non-null districts, met_station_ids, and verified coordinates
        const { data: existingStations, error: existingStationsError } = await supabase
          .from('climate_stations')
          .select('station_id, district, met_station_id, latitude, longitude')
          .eq('country_code', targetCountry);

        if (existingStationsError) throw existingStationsError;

        const existingDistrictMap = new Map<string, string>();
        const existingMetIdMap = new Map<string, string>();
        const existingCoordMap = new Map<string, { latitude: number; longitude: number }>();
        for (const s of existingStations || []) {
          if (s.district) existingDistrictMap.set(s.station_id, s.district);
          if (s.met_station_id) existingMetIdMap.set(s.station_id, s.met_station_id);
          if (s.latitude !== null && s.longitude !== null && !(Number(s.latitude) === 0 && Number(s.longitude) === 0)) {
            existingCoordMap.set(s.station_id, {
              latitude: Number(s.latitude),
              longitude: Number(s.longitude),
            });
          }
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

        // 5. Build station rows: preserve existing non-null DB district, met_station_id, and verified coordinates
        const update = candidateStations.map((d: any) => {
          const slug = toCleanSlug(d.station_id);

          // Preserve existing DB district if present; do not override with upstream null
          const district = existingDistrictMap.get(slug) || d.district || null;

          // Resolve met_station_id: mapped WMO/Climsoft ID -> existing DB ID -> upstream ID
          const metStationId =
            metStationIdMap.get(d.station_name) || existingMetIdMap.get(slug) || d.met_station_id || null;

          // Coordinate validation and preservation:
          // Check if upstream coordinates are valid (reject null, 0/0, out-of-range, or inverted signs)
          const existingCoord = existingCoordMap.get(slug);
          const rawLat = d.latitude !== null && d.latitude !== undefined ? Number(d.latitude) : null;
          const rawLon = d.longitude !== null && d.longitude !== undefined ? Number(d.longitude) : null;

          const isUpstreamCoordValid =
            rawLat !== null &&
            rawLon !== null &&
            !(rawLat === 0 && rawLon === 0) &&
            Math.abs(rawLat) <= 90 &&
            Math.abs(rawLon) <= 180 &&
            (['zw', 'zm', 'mw'].includes(targetCountry) ? rawLat < 0 && rawLon > 0 : true);

          // Preserve existing verified DB coordinates to prevent upstream errors from corrupting locations
          const latitude = existingCoord ? existingCoord.latitude : isUpstreamCoordValid ? rawLat : null;
          const longitude = existingCoord ? existingCoord.longitude : isUpstreamCoordValid ? rawLon : null;

          return {
            station_id: slug,
            country_code: targetCountry,
            station_name: d.station_name,
            latitude,
            longitude,
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

import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import createClient from 'openapi-fetch';
import type * as ClimateApi from '../../../types/climate-api.types.ts';
import type { Database } from '../../../types/db.types.ts';

type ClimateStationData = Database['public']['Tables']['climate_station_data']['Insert'];

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

interface StationSummaryConfig {
  endpoint: keyof ClimateApi.paths;
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

const upsertStationSummary = async (
  supabase: ReturnType<typeof getServiceRoleClient>,
  station: { id: string; country_code: string; station_name?: string },
  apiResult: { data?: SummaryApiResponse; error?: any; response?: Response },
  dataField: keyof ClimateStationData,
  metadataField: keyof ClimateStationData,
  endpointName: string,
) => {
  const { data: apiData, error: apiError, response } = apiResult;
  if (apiError) {
    console.error(`[${endpointName}] API Error:`, apiError);
    const status = response?.status && response.status >= 400 && response.status < 600 ? response.status : 502;
    const errorPayload = typeof apiError === 'object' ? apiError : { message: String(apiError) };
    return ErrorResponse(errorPayload, status);
  }

  if (!apiData?.data || apiData.data.length === 0) {
    console.warn(
      `[${endpointName}] No data returned for ${station.station_name} (${station.country_code}), preserving existing data.`,
    );
    return JSONResponse(apiData);
  }

  const { error } = await supabase.from('climate_station_data').upsert({
    country_code: station.country_code as Database['public']['Enums']['country_code'],
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
    if (isStationSummaryAction(action)) {
      if (!station?.station_name || !station?.id) {
        return ErrorResponse(`[${action}] Station with id and station_name is required`, 400);
      }

      const config = STATION_SUMMARY_CONFIGS[action];
      const body: Record<string, any> = {
        country: `${country_code}`,
        station_id: `${station.station_name}`,
      };
      if ('summaries' in config && config.summaries) {
        body.summaries = [...config.summaries];
      }

      const apiResult = await apiClient.POST(config.endpoint as any, { body } as any);

      // Check row limit if configured (e.g. rainfall summaries API glitch returning thousands of rows)
      if (
        'maxRows' in config &&
        config.maxRows &&
        apiResult.data?.data &&
        apiResult.data.data.length > config.maxRows
      ) {
        console.error({
          country_code,
          station_id: station.id,
          station_name: station.station_name,
          total_rows: apiResult.data.data.length,
        });
        return ErrorResponse(
          `[${config.endpointName}] Too many rows | ${station.station_name} ${apiResult.data.data.length}`,
          400,
        );
      }

      return upsertStationSummary(
        supabase,
        station,
        apiResult,
        config.dataField,
        config.metadataField,
        config.endpointName,
      );
    }

    switch (action) {
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

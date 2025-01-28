import type { Database } from '../../types/index.ts';
import type {
  paths as climateApiPaths,
  components as climateApiComponents,
} from '../../../../picsa-apps/dashboard/src/app/modules/climate/types/api.d.ts';
import { getClient } from '../_shared/client.ts';
import { getJsonData } from '../_shared/request.ts';
import { JSONResponse } from '../_shared/response.ts';

/**
 * Read the endpoint from env. Note, if running climate api in local docker container update `.env` to:
 * ```env
 * CLIMATE_API_ENDPOINT=http://host.docker.internal:8000
 * ```
 * https://github.com/orgs/supabase/discussions/9837
 */
const CLIMATE_API_ENDPOINT = Deno.env.get('CLIMATE_API_ENDPOINT') || 'https://api.epicsa.idems.international';
const COUNTRY_CODES = ['mw', 'zm'];

// Create typed fetch client from open-api definition exported by climate api
import createClient from 'openapi-fetch';
const apiClient = createClient<climateApiPaths>({ baseUrl: CLIMATE_API_ENDPOINT, mode: 'cors' });

type IDBClimateForecast = Database['public']['Tables']['climate_forecasts']['Insert'];
type IApiClimateForecast = climateApiComponents['schemas']['DocumentMetadata'];

/**
 * Update
 */
export const climateForecastUpdate = async (req: Request) => {
  // Validate body formData
  // TODO - Improve validators and feedback
  let { country_codes = COUNTRY_CODES, query_prefix } = await getJsonData(req);

  // Default query for documents stored in the current month,
  if (!query_prefix) {
    query_prefix = new Date().toISOString().replace(/-/, '').substring(0, 6);
  }

  const responses = [];

  for (const country_code of country_codes) {
    try {
      const data = await getCountryUpdates(country_code, query_prefix);
      responses.push({ country_code, data });
    } catch (error) {
      responses.push({ country_code, error });
    }
  }
  return JSONResponse(responses);
};

async function getCountryUpdates(country_code: string, query_prefix: string) {
  // retrieve latest api forecast for query and existing db forecasts for query
  // filter results to only include api forecasts not present on db
  const apiForecasts = await getApiForecasts({ country_code, query_prefix });
  const dbForecasts = await getDBForecasts({ country_code, query_prefix });

  const dbForecastIds = dbForecasts.map((v) => v.id);
  const newForecasts = apiForecasts.filter((v) => !dbForecastIds.includes(v.name));
  if (newForecasts.length === 0) {
    return [];
  }

  // map api forecasts to db format and update db
  const updates = mapApiForecastToDb(newForecasts, country_code);
  const supabaseClient = getClient();
  const { error } = await supabaseClient.from('climate_forecasts').insert(updates);
  if (error) {
    throw error;
  }
  return updates;
}

async function getApiForecasts(query: { country_code: string; query_prefix?: string }) {
  const { country_code, query_prefix } = query;
  const { data, error } = await apiClient.GET('/v1/documents/{country}', {
    params: { path: { country: country_code as any }, query: { prefix: query_prefix, max_results: 1000 } },
  });
  if (error) {
    throw error;
  }
  return data as IApiClimateForecast[];
}

async function getDBForecasts(query: { country_code: string; query_prefix: string }) {
  const supabaseClient = getClient();
  const { country_code, query_prefix } = query;
  console.log('db query', query_prefix, country_code);
  const { data, error } = await supabaseClient
    .from('climate_forecasts')
    .select('*')
    .like('id', `${query_prefix}%`)
    .eq('country_code', country_code)
    .order('id', { ascending: false });

  if (error) {
    throw error.message;
  }
  return data;
}

function mapApiForecastToDb(apiForecasts: IApiClimateForecast[], country_code: string): IDBClimateForecast[] {
  return apiForecasts.map((v) => ({
    country_code,
    id: v.name,
    forecast_type: 'daily',
    mimetype: v.contentType,
  }));
}

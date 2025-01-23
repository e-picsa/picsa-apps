import type { Database } from '../../types/index.ts';
import type {
  paths as climateApiPaths,
  components as climateApiComponents,
} from '../../../../picsa-apps/dashboard/src/app/modules/climate/types/api.d.ts';
import { getClient } from '../_shared/client.ts';
import { getFormData } from '../_shared/request.ts';
import { JSONResponse } from '../_shared/response.ts';

// const API_ENDPOINT = 'https://api.epicsa.idems.international';

// NOTE - calling localhost functions from within dockerised function contianer requires alt url
// https://github.com/orgs/supabase/discussions/9837
const API_ENDPOINT = 'http://host.docker.internal:8000';

// Create typed fetch client from open-api definition exported by climate api
import createClient from 'npm:openapi-fetch';
import { ErrorResponse } from '../_shared/response.ts';
const apiClient = createClient<climateApiPaths>({ baseUrl: API_ENDPOINT, mode: 'cors' });

type IDBClimateForecast = Database['public']['Tables']['climate_forecasts']['Insert'];
type IApiClimateForecast = climateApiComponents['schemas']['DocumentMetadata'];

/**
 * Update
 */
export const climateForecastUpdate = async (req: Request) => {
  // Validate body formData
  // TODO - Improve validators and feedback
  const { fields } = await getFormData(req);
  const { country_code, query_prefix } = fields;
  if (!country_code) {
    return ErrorResponse('country_code required', 400);
  }
  // retrieve latest api forecast for query and existing db forecasts for query
  // filter results to only include api forecasts not present on db
  const apiForecasts = await getApiForecasts(country_code, query_prefix);
  const dbForecasts = await getDBForecasts(country_code, query_prefix);
  const dbForecastIds = dbForecasts.map((v) => v.id);
  const newForecasts = apiForecasts.filter((v) => !dbForecastIds.includes(v.name));
  if (newForecasts.length === 0) {
    return JSONResponse([], 200);
  }

  // map api forecasts to db format and update db
  const updates = mapApiForecastToDb(newForecasts, country_code);
  const supabaseClient = getClient();
  const { error } = await supabaseClient.from('climate_forecasts').insert(updates);
  if (error) {
    return ErrorResponse('DB insert failed', 400);
  }
  return JSONResponse(updates, 201);
};

async function getApiForecasts(country_code: string, query_prefix?: string) {
  if (!query_prefix) {
    query_prefix = new Date().toISOString().replace(/-/, '').substring(0, 6);
  }
  const { data, error } = await apiClient.GET('/v1/documents/{country}', {
    params: { path: { country: country_code as any }, query: { prefix: query_prefix, max_results: 1000 } },
  });
  if (error) {
    throw error;
  }
  return data as IApiClimateForecast[];
}

async function getDBForecasts(country_code: string, query_prefix: string) {
  const supabaseClient = getClient();
  const { data, error } = await supabaseClient
    .from('climate_forecasts')
    .select('*')
    .order('id', { ascending: false })
    .eq('country_code', country_code)
    .ilike('id', `${query_prefix}%`);

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

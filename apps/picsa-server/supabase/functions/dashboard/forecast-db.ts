import { getClient } from '../_shared/client.ts';
import { getJsonData } from '../_shared/request.ts';
import { ErrorResponse } from '../_shared/response.ts';
import { JSONResponse } from '../_shared/response.ts';

import type {
  climateApiPaths,
  IApiClimateForecast,
  IDBClimateForecastInsert,
  IForecastDBAPIResponse,
} from './types.ts';

/**
 * Read the endpoint from env. Note, if running climate api in local docker container update `.env` to:
 * ```env
 * CLIMATE_API_ENDPOINT=http://host.docker.internal:8000
 * ```
 * https://github.com/orgs/supabase/discussions/9837
 */
export const CLIMATE_API_ENDPOINT = Deno.env.get('CLIMATE_API_ENDPOINT') || 'https://api.epicsa.idems.international';
export const ALL_COUNTRY_CODES = ['mw', 'zm'];

// Create typed fetch client from open-api definition exported by climate api
import createClient from 'openapi-fetch';
export const apiClient = createClient<climateApiPaths>({ baseUrl: CLIMATE_API_ENDPOINT, mode: 'cors' });

/**
 * Update cliamte forecast db rows
 */
export const forecastDB = async (req: Request) => {
  // TODO - Improve validators and feedback
  let { country_code, query_prefix } = await getJsonData(req);

  // Retrieve single country if specified, default all
  const country_codes = country_code ? [country_code] : ALL_COUNTRY_CODES;

  // Default query for documents stored in the current month,
  if (!query_prefix) {
    query_prefix = new Date().toISOString().replace(/-/, '').substring(0, 6);
  }

  const response: IForecastDBAPIResponse = {};
  const errors = [];

  for (const country_code of country_codes) {
    try {
      const data = await getCountryUpdates(country_code, query_prefix);
      response[country_code] = data;
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    return ErrorResponse(errors);
  }
  return JSONResponse(response);
};

async function getCountryUpdates(country_code: string, query_prefix: string) {
  // retrieve latest api forecast for query and existing db forecasts for query
  // filter results to only include api forecasts not present on db
  const apiForecasts = await getApiForecasts({ country_code, query_prefix });
  const dbForecasts = await getDBForecasts({ country_code, query_prefix });
  const dbForecastIds = dbForecasts.map((v) => v.id);
  const newForecasts = apiForecasts.filter((v) => !dbForecastIds.includes(v.name));
  console.log(`${country_code}: ${newForecasts.length} New Forecasts`);
  if (newForecasts.length === 0) {
    return [];
  }

  // map api forecasts to db format and update db
  const updates = mapApiForecastToDb(newForecasts, country_code);
  const supabaseClient = getClient();
  const { error } = await supabaseClient.from('forecasts').insert(updates);
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
  const { data, error } = await supabaseClient
    .from('forecasts')
    .select('*')
    .like('id', `${query_prefix}%`)
    .eq('country_code', country_code)
    .order('id', { ascending: false });

  if (error) {
    throw error.message;
  }
  return data;
}

function mapApiForecastToDb(apiForecasts: IApiClimateForecast[], country_code: string): IDBClimateForecastInsert[] {
  return apiForecasts.map((v) => ({
    country_code,
    id: v.name,
    forecast_type: mapForecastType(v),
    mimetype: v.contentType,
    label: v.metadata?.subject || null,
  }));
}

const FORECAST_TYPE_MAPPINGS: {
  sender: string;
  subjectKeyword: string;
  type: IDBClimateForecastInsert['forecast_type'];
}[] = [
  { sender: 'zambianweather@gmail.com', subjectKeyword: '7day', type: 'weekly' },
  { sender: 'metmalawi.gov.mw', subjectKeyword: 'fiveday', type: 'weekly' },
];

function mapForecastType(apiForecast: IApiClimateForecast): IDBClimateForecastInsert['forecast_type'] {
  const { sender, subject } = apiForecast.metadata || {};
  // Fallback assume daily
  if (!sender || !subject) {
    return 'daily';
  }
  const cleanSubject = subject.toLowerCase().replace(/ /g, '');
  // Use keyword mapping to try and identify type
  const mapping = FORECAST_TYPE_MAPPINGS.find(
    (m) => sender.includes(m.sender) && cleanSubject.includes(m.subjectKeyword),
  );

  return mapping?.type || 'daily';
}

import type { Database } from '../../types/index.ts';
import { getClient } from '../_shared/client.ts';
import { getFormData } from '../_shared/request.ts';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';

const exampleForecast = {
  name: '20250120/zambia-lunchtime-weather-report-monday-20-01-2025.html',
  contentType: 'text/html',
  size: 74746,
  timeCreated: '2025-01-20T09:01:18.339000+00:00',
  updated: '2025-01-20T09:01:18.339000+00:00',
};
type IApiForecast = typeof exampleForecast;

type IDBClimateForecast = Database['public']['Tables']['climate_forecasts']['Insert'];

// TODO - find way to share with dashboard code

// const API_ENDPOINT = 'https://api.epicsa.idems.international';

// NOTE - calling localhost functions from within dockerised function contianer requires alt url
// https://github.com/orgs/supabase/discussions/9837
const API_ENDPOINT = 'http://host.docker.internal:8000';

const url = new URL(API_ENDPOINT);

export const climateForecastUpdate = async (req: Request) => {
  // TODO - type-safe client?
  const { fields } = await getFormData(req);
  const { country_code } = fields;
  if (!country_code) {
    return ErrorResponse(`country_code required`, 400);
  }
  const apiForecasts = await getApiForecasts(country_code);
  const latestForecast = await getDBLatestForecast(country_code);

  const newForecasts = latestForecast ? apiForecasts.filter((v) => v.name > latestForecast.id) : apiForecasts;

  //   TODO - make less hacky, better explained
  if (newForecasts.length === 0) {
    return JSONResponse({ inserted: [] });
  }

  const dbForecasts = mapApiForecastToDb(newForecasts, country_code);
  const supabaseClient = getClient();
  const { error, status } = await supabaseClient.from('climate_forecasts').insert(dbForecasts);
  if (error) {
    return ErrorResponse(error.message, status);
  }
  return JSONResponse({ inserted: dbForecasts });
};

async function getApiForecasts(country_code: string) {
  url.pathname = `/v1/documents/${country_code}`;
  url.searchParams.set('prefix', new Date().toISOString().replace(/-/, '').substring(0, 6));
  url.searchParams.set('max_results', '1000');
  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } }).catch((err: TypeError) => {
    console.error('getApiForecasts', err);
    return new Response(err.message, { status: 500 });
  });
  if (res.status !== 200) {
    const msg = await res.text();
    throw new Error(msg);
  }
  const forecasts: IApiForecast[] = await res.json();
  return forecasts;
}

async function getDBLatestForecast(country_code: string) {
  const supabaseClient = getClient();
  const { data, error, status } = await supabaseClient
    .from('climate_forecasts')
    .select('*')
    .order('id', { ascending: false })
    .eq('country_code', country_code)
    .limit(1)
    .maybeSingle();
  // get data newer than most recent
  console.log({ data, error, status });

  if (error) {
    throw error.message;
  }
  return data;
}
// TODO - check dashboard code (or migrate all to call here instead)
function mapApiForecastToDb(apiForecasts: IApiForecast[], country_code: string): IDBClimateForecast[] {
  return apiForecasts.map((v) => ({
    country_code,
    id: v.name,
    forecast_type: 'daily',
    mimetype: v.contentType,
  }));
}

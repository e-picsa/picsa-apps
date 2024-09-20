import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getClient } from '../_shared/client.ts';

const API_URL = 'https://api.epicsa.idems.international/v1/forecasts/';

interface IForecastInsert {
  date_modified: string;
  filename: string;
  country_code: string;
  type: string;
  id: string;
}

// function to format the forecast data
const formatForecastData = (data: any, country_code: string): IForecastInsert[] => {
  return data.map((d: any): IForecastInsert => {
    const { date, filename, format, type } = d;
    return {
      date_modified: date,
      filename,
      country_code,
      type,
      id: filename.split('/').pop(),
    };
  });
};

// function to handle fetching and updating forecast data
const handleForecastUpdate = async (countryCode: string, req: Request) => {
  try {
    // fetching forecast data
    const response = await fetch(`${API_URL}/${countryCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    console.log('forecastData', response);

    const forecastData = await response.json();

    const formattedData = formatForecastData(forecastData, countryCode);

    const supabase = getClient(req);

    const { error } = await supabase.from('climate_forecasts').upsert(formattedData);

    if (error) {
      throw new Error('Error updating database');
    }

    return new Response('Forecast data updated successfully', { status: 200 });
  } catch (err: any) {
    console.log(err);
    return new Response('Error: ' + err.message, { status: 500 });
  }
};

// main server function
serve(async (req) => {
  const url = new URL(req.url);
  const country_code = url.searchParams.get('country_code') || 'zw';

  return await handleForecastUpdate(country_code, req);
});

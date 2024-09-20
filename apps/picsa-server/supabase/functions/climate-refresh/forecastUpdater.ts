import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_URL = 'https://api.epicsa.idems.international/v1/forecasts';

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
const handleForecastUpdate = async (countryCode: string) => {
  try {
    // fetch forecast data from the external API
    const response = await fetch(`${API_URL}/${countryCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }

    const forecastData = await response.json();

    const formattedData = formatForecastData(forecastData, countryCode);

    const { error } = await supabase.from('climate_forecasts').upsert(formattedData);

    if (error) {
      throw new Error('Error updating database');
    }

    return new Response('Forecast data updated successfully', { status: 200 });
  } catch (err: any) {
    return new Response('Error: ' + err.message, { status: 500 });
  }
};

// main server function
serve(async (req) => {
  const url = new URL(req.url);
  const country_code = url.searchParams.get('country_code') || 'zw';

  return await handleForecastUpdate(country_code);
});

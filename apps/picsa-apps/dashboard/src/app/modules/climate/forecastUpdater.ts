import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

// TODO:SET up env for this
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_URL = 'https://api.epicsa.idems.international/v1/forecasts';

const handleForecastUpdate = async (countryCode: string) => {
  try {
    // Fetch forecast data from external API
    const response = await fetch(`${API_URL}/${countryCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    const forecastData = await response.json();

    const { error } = await supabase.from('climate_forecasts').upsert(forecastData);

    if (error) {
      throw new Error('Error updating database');
    }

    return new Response('Forecast data updated successfully', { status: 200 });
  } catch (err: any) {
    return new Response('Error: ' + err.message, { status: 500 });
  }
};

// Main server function to handle requests
serve(async (req) => {
  const countryCode = 'zw';
  return await handleForecastUpdate(countryCode);
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getClient } from '../_shared/client.ts';

const API_URL = 'https://api.epicsa.idems.international/v1/documents';

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
    const { name, updated, contentType } = d;

    const id = name ? `documents/${country_code}/${name.split('/').pop()}` : `documents/${country_code}/unknown`;

    return {
      date_modified: updated,
      filename: name || '',
      country_code,
      type: contentType || '',
      id,
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

    const { files } = await response.json();

    const formattedData = formatForecastData(files, countryCode);
    console.log('forecastData', formattedData);

    const supabase = getClient(req);

    const { error } = await supabase.from('climate_forecasts').upsert(formattedData);

    if (error) {
      throw new Error('Error updating database');
    }

    return new Response(JSON.stringify({ message: 'Forecast data updated successfully', data: formattedData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.log(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// main server function
serve(async (req) => {
  const url = new URL(req.url);
  const country_code = url.searchParams.get('country_code') || 'zw';

  return await handleForecastUpdate(country_code, req);
});

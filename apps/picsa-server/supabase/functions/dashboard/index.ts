// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { climateForecastStorage } from './climate-forecast-storage.ts';
import { climateForecastDB } from './climate-forecast-db.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve((req) => {
  // handle cors pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Try sending a POST request instead', { status: 400 });
  }

  const endpoint = req.url.split('/').pop();

  switch (endpoint) {
    case 'climate-forecast-db':
      return climateForecastDB(req);
    case 'climate-forecast-storage':
      return climateForecastStorage(req);

    default:
      return new Response(`Invalid endpoint: ${endpoint}`, {
        status: 501,
      });
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/dashboard' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'

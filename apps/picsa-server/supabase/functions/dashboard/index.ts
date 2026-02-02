// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { forecastStorage } from './forecast-storage.ts';
import { forecastDB } from './forecast-db.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { admin } from './admin/index.ts';
import { climate } from './climate/index.ts';
import { forecastCleanup } from './forecast-cleanup.ts';

serve((req) => {
  // handle cors pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Try sending a POST request instead', { status: 400 });
  }
  const { pathname } = new URL(req.url);
  // e.g. /dashboard/admin/list-users
  const entryPoint = pathname.split('/')[2];

  switch (entryPoint) {
    case 'admin':
      return admin(req);
    case 'forecast-db':
      return forecastDB(req);
    case 'forecast-storage':
      return forecastStorage(req);
    case 'forecast-cleanup':
      return forecastCleanup(req);
    case 'climate':
      return climate(req);

    default:
      return new Response(`Invalid endpoint: ${entryPoint}`, {
        status: 501,
      });
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/dashboard' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'

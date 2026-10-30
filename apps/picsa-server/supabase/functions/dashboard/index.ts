// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { corsHeaders } from '../_shared/cors.ts';
import { ErrorResponse } from '../_shared/response.ts';
import { admin } from './admin/index.ts';
import { climate } from './climate/index.ts';
import { deployments } from './deployments/index.ts';
import { feedback } from './feedback/index.ts';
import { forecastDB, forecastStorage, forecastCleanup } from './forecasts/index.ts';

Deno.serve(async (req: Request) => {
  // handle cors pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Try sending a POST request instead', {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const { pathname } = new URL(req.url);
    // e.g. /dashboard/admin/list-users
    const entryPoint = pathname.split('/')[2];

    switch (entryPoint) {
      case 'admin':
        return await admin(req);
      case 'forecast-db':
        return await forecastDB(req);
      case 'forecast-storage':
        return await forecastStorage(req);
      case 'forecast-cleanup':
        return await forecastCleanup(req);
      case 'climate':
        return await climate(req);
      case 'deployments':
        return await deployments(req);
      case 'feedback':
        return await feedback(req);

      default:
        return new Response(`Invalid endpoint: ${entryPoint}`, {
          status: 501,
          headers: corsHeaders,
        });
    }
  } catch (error: any) {
    console.error('[dashboard] Unhandled function error:', error);
    return ErrorResponse(error?.message || 'Internal Server Error', 500);
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/dashboard' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'

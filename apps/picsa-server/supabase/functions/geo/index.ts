import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { adminBoundaries } from './admin-boundaries.ts';

serve((req: Request) => {
  // handle cors pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Try sending a POST or GET request instead', { status: 400 });
  }

  const { pathname } = new URL(req.url);
  // e.g. /climate/country-boundaries/zw
  const pathParts = pathname.split('/');
  const entryPoint = pathParts[2];

  switch (entryPoint) {
    case 'admin-boundaries':
      if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      }
      return adminBoundaries(req);

    default:
      return new Response(`Invalid climate endpoint: ${entryPoint}`, {
        status: 501,
        headers: corsHeaders, // Keep CORS headers even on error
      });
  }
});

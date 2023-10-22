import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';

/**
 * Example extract multipart form from POST request
 */
serve(async (req) => {
  if (req.headers.has('content-type') && req.headers.get('content-type')?.startsWith('multipart/form-data')) {
    const form = await multiParser(req);
    return new Response(JSON.stringify(form), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('No data included', { headers: { 'Content-Type': 'application/json' } });
});

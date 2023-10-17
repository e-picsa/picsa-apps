// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  console.log('hello', req.method);
  if (req.method !== 'POST') {
    return new Response('Try sending a POST request instead', { status: 400 });
  }

  try {
    // Parse body
    // https://deno.land/api@v1.37.1?s=Body

    // Return back any JSON-formatted data submitted with POST request
    const data = await req.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const data = {
      message: 'Request should include json body',
      error: error.message,
    };
    console.error(error);
    return new Response(JSON.stringify(data), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'

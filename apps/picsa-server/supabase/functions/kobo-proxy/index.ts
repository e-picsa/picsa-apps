// Initialize the JS client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

// const xml = `<?xml version="1.0" encoding="utf-8"?>
// <aLgKwDoHNd38sZyBQMV293 xmlns:jr="http://openrosa.org/javarosa"
//     xmlns:orx="http://openrosa.org/xforms" id="aLgKwDoHNd38sZyBQMV293" version="1 (2023-05-15 11:11:37)">
//     <formhub>
//         <uuid>e2bf18a988214fe09c18e6b70298959a</uuid>
//     </formhub>
//     <start>2023-10-12T13:47:32.569-07:00</start>
//     <end>2023-10-12T13:47:35.485-07:00</end>
//     <q1>test</q1>
//     <__version__>vJ8FXDvzh4rCWFBUbjfnPs</__version__>
//     <meta>
//         <instanceID>uuid:c4162796-baa4-407f-a7c6-0885dc16053d</instanceID>
//     </meta>
// </aLgKwDoHNd38sZyBQMV293>`;

/**
 * TODO
 * - Read from DB
 * - Handle update
 * - Handle delete
 */
serve(async (req) => {
  console.log('hello kobo proxy');
  if (req.method === 'POST') {
    const token = Deno.env.get('KOBO_API_KEY');
    if (!token) {
      return ErrorResponse('KOBO_API_KEY not provided. Please include in .env');
    }
    // TODO - validate body
    try {
      const form = await multiParser(req);
      const xml = form?.fields.xml;
      console.log('xml', xml);
      if (xml) {
        const headers = { 'X-OpenRosa-Version': '1.0', authorization: 'Token ' + token };
        const blob = new Blob([xml], { type: 'application/xml' });
        const body = new FormData();
        body.set('xml_submission_file', blob);
        return await fetch('https://kc.kobotoolbox.org/api/v1/submissions', { headers, method: 'POST', body });
      }
    } catch (error) {
      return new Response(error.message, { status: 400 });
    }

    // TODO - pass back resonse from kobo
    return new Response('Success', { status: 201 });
  }
  return new Response('Invalid Request', { status: 400 });
  // return new Response('No data included', { headers: { 'Content-Type': 'application/json' } });
});

function ErrorResponse(msg: string, status = 400) {
  return new Response(JSON.stringify({ msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

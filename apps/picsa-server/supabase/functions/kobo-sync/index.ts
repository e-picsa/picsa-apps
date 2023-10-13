// Initialize the JS client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getClient } from '../_shared/client.ts';

/**
 * TODO
 * - Read from DB
 * - Handle update
 *      Currently updating data creates new record, either need to delete old before update or find way to update
 * - Handle delete
 *
 *
 * https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/select-from-table-with-auth-rls/index.ts
 */
serve(async (req) => {
  const client = getClient(req);
  // define table getter as function to avoid accidentally chaining
  const table = () => client.from('monitoring_tool_submissions');

  if (req.method === 'POST') {
    // Use generated _kobo_sync_required column to list docs requiring push
    const { count, data, error } = await table()
      .select(`_id,_kobo_sync_time,enketoEntry,_kobo_sync_required`, { count: 'exact' })
      .eq('_kobo_sync_required', true);

    console.log({ count, data, error });
    if (data) {
      const results: any[] = [];
      for (const { enketoEntry, _id } of data) {
        const { xml } = enketoEntry as { xml: string };
        const res = await submitKoboXml(xml);
        const { status, statusText } = res;
        // TODO - could also include body (html) if available
        results.push({ status, statusText, _id });
        if (res.status === 201 || res.status === 202) {
          const update = await table().update({ _kobo_sync_time: new Date().toISOString() }).eq('_id', _id).select();
          console.log('update', update);
        } else {
          console.log('submit failed?', res);
        }
      }
      //
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // const res = await table.select('enketoEntry').gt('_kobo_sync_time', latestSync);

    return new Response(JSON.stringify({ test: 'hello' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('Invalid Request', { status: 400 });
  // return new Response('No data included', { headers: { 'Content-Type': 'application/json' } });
});

async function submitKoboXml(xml: string) {
  const token = Deno.env.get('KOBO_API_KEY');
  if (!token) {
    return ErrorResponse('KOBO_API_KEY not provided. Please include in .env');
  }
  const headers = { 'X-OpenRosa-Version': '1.0', authorization: 'Token ' + token };
  const blob = new Blob([xml], { type: 'application/xml' });
  const body = new FormData();
  body.set('xml_submission_file', blob);
  return await fetch('https://kc.kobotoolbox.org/api/v1/submissions', { headers, method: 'POST', body });
}

function ErrorResponse(msg: string, status = 400) {
  return new Response(JSON.stringify({ msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

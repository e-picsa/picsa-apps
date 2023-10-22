// Initialize the JS client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';
import { corsHeaders } from '../../_shared/cors.ts';
import { upsertKoboSubmission } from '../../_kobo/kobo-utils.ts';

/** Expected format of post data received */
interface IFormData {
  xml: string;
}

/**
 * @DEPRECATED
 * Endpoints to allow app to communicate directly with kobo endpoint
 *
 * TODO
 * - Read from DB
 * - Handle update
 * - Handle delete
 */
serve(async (req) => {
  return await handleRequest(req);
});

// Separate out handler to allow direct invocation from test
async function handleRequest(req: Request) {
  if (req.method === 'POST') {
    // validation
    const hasFormData =
      req.headers.has('content-type') && req.headers.get('content-type')?.startsWith('multipart/form-data');
    if (!hasFormData) {
      return ErrorResponse('Formdata expected but not found');
    }
    const form = await multiParser(req);
    const { xml } = form?.fields as unknown as IFormData;
    if (!xml) {
      return ErrorResponse('XML not included with form');
    }
    return _internals.handleUpsert(xml);
  }

  //
  if (req.method === 'DELETE') {
    // TODO - handle delete request
  }
  return ErrorResponse(`${req.method} not supported`);
}

async function handleUpsert(xml: string) {
  const upsertRes = await upsertKoboSubmission(xml);
  const { status, statusText, ...details } = upsertRes;
  return new Response(JSON.stringify(details), { status, statusText });
}

function ErrorResponse(msg: string, status = 400) {
  return new Response(JSON.stringify({ msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Wrap internal handlers for easier testing exposure */
export const _internals = {
  handleRequest,
  handleUpsert,
};

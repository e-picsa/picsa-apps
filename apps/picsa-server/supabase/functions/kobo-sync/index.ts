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
  if (req.method === 'POST') {
    const { results, status } = await new KoboSyncHandler(req).run();

    return new Response(JSON.stringify(results), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('Method not supported: ' + req.method, { status: 400 });
});

class KoboSyncHandler {
  public results: any[] = [];

  public status = 200;

  private client;
  constructor(req: Request) {
    this.client = getClient(req);
  }
  private get table() {
    return this.client.from('monitoring_tool_submissions');
  }
  public async run() {
    const pending = await this.listPending();

    for (const entry of pending) {
      await this.syncPendingSubmission(entry);
    }
    return { status: this.status, results: this.results };
  }

  /**
   *
   * @param entry
   * @returns
   */
  private async syncPendingSubmission(entry: {
    enketoEntry: any;
    _id: string;
    _kobo_form_id: string | null;
    _kobo_uuid: string | null;
  }) {
    const { _kobo_form_id, _kobo_uuid, _id, enketoEntry } = entry;

    // Handle existing submission delete
    if (_kobo_form_id && _kobo_uuid) {
      // previous submission exists, delete first before uploading new
      const { status, statusText } = await deleteKoboSubmission(_kobo_form_id, _kobo_uuid);
      this.results.push({ operation: 'DELETE', status, statusText, _id, _kobo_form_id, _kobo_uuid });
      // Could not delete, break
      // May return 404 status if already deleted, or 200 successful delete
      if (status === 500) {
        this.status = status;
        return;
      }
    }

    // Handle new submission create
    const res = await createKoboSubmission((enketoEntry as any).xml);

    const { status, statusText } = res;
    this.results.push({ operation: 'CREATE', status, statusText, _id });
    // 201 - submission created succesfully, patch db entry

    if (res.status === 201) {
      const updateResponseXML = await res.text();
      await this.updateDBEntry(updateResponseXML, _id);
    }
  }

  /**
   *
   * @param updateResponseXML
   * @param _id
   */
  private async updateDBEntry(updateResponseXML: string, _id: string) {
    const patch: Record<string, string> = { _kobo_sync_time: new Date().toISOString() };
    const { instanceID, id } = extractResponseXML(updateResponseXML);
    if (instanceID) {
      patch._kobo_uuid = instanceID.replace('uuid:', '');
    }
    if (id) {
      patch._kobo_form_id = id;
    }
    const { status, statusText } = await this.table.update(patch).eq('_id', _id).select();
    this.results.push({ operation: 'PATCH', status, statusText, _id, patch, updateResponseXML });
  }

  private async listPending() {
    const { data, error } = await this.table
      .select(`_id,enketoEntry,_kobo_form_id,_kobo_uuid`, { count: 'exact' })
      .eq('_kobo_sync_required', true);
    return data || [];
  }
}

async function createKoboSubmission(xml: string) {
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

/**
 *
 * @param formId
 * @param dataId
 * @returns 204 response
 *
 * NOTE - can also be handled through kc.kobotoolbox.org/api/v1/data api but requires numeric form id (?)
 * TODO - v2 api also needs numeric id
 */
async function deleteKoboSubmission(formId: string, uuid: string) {
  const token = Deno.env.get('KOBO_API_KEY');
  if (!token) {
    return ErrorResponse('KOBO_API_KEY not provided. Please include in .env');
  }
  const headers = { 'X-OpenRosa-Version': '1.0', authorization: 'Token ' + token };
  // Make a get request for UUID to get additional numeric id property required for delete operation
  const getRes = await fetch(`https://kf.kobotoolbox.org/api/v2/assets/${formId}/data/${uuid}?format=json`, {
    headers,
    method: 'GET',
  });
  if (getRes.status === 200) {
    const { _id } = await getRes.json();
    return await fetch(`https://kf.kobotoolbox.org/api/v2/assets/${formId}/data/${_id}`, {
      headers,
      method: 'DELETE',
    });
  } else {
    return getRes;
  }
}

function ErrorResponse(msg: string, status = 400) {
  return new Response(JSON.stringify({ msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Extract key-value pairs from response xml, e.g.
 * <submissionMetadata id="aQCDPoHBUkgJRWQgswksoo" instanceID="uuid:78bd4c91-407c-4f8b-9ab5-c88a6a39a482"
 * {id:"aQCDPoHBUkgJRWQgswksoo", instanceID:"uuid:78bd4c91-407c-4f8b-9ab5-c88a6a39a482"}
 * */
function extractResponseXML(xml: string) {
  const regex = /(?<key>[\w]+)="(?<value>[^"]*)"/gi;
  const data: Record<string, string> = {};

  for (const match of xml.matchAll(regex)) {
    if (match?.groups) {
      data[match.groups.key] = match.groups.value;
    }
  }
  return data;
}

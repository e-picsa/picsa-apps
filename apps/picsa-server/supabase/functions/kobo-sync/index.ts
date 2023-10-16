// Initialize the JS client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { getClient } from '../_shared/client.ts';
import { createKoboSubmission,  deleteKoboSubmissionByUUID, extractKoboResponse } from '../_kobo/kobo-utils.ts';

/**
 * TODO
 * - Handle db delete
 *
 *
 * https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/select-from-table-with-auth-rls/index.ts
 */
serve(async (req:Request) => {
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
    // TODO - simplify to single upsert method that checks for existing using enketo entry xml only
    // TOOD - tests

    // Handle existing submission delete
    if (_kobo_form_id && _kobo_uuid) {
      // previous submission exists, delete first before uploading new
      const { status, statusText } = await deleteKoboSubmissionByUUID(_kobo_form_id, _kobo_uuid);
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
      const { json } = await extractKoboResponse(res);
      console.log('update db entry',json.submissionMetadata.)
      // TODO - extract form and instance id before upsert
      await this.updateDBEntry(_id);
    }
  }

  /**
   *
   * @param updateResponseXML
   * @param _id - db row id
   * @param instanceID - kobo instance id
   */
  private async updateDBEntry(_id: string, instanceID:string) {
    const patch: Record<string, string> = { _kobo_sync_time: new Date().toISOString() };
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



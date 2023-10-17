// Initialize the JS client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { getClient } from '../_shared/client.ts';
import {
  createKoboSubmission,
  deleteKoboSubmissionByUUID,
  extractSubmissionXML,
  upsertKoboSubmission,
} from '../_kobo/kobo-utils.ts';

/**
 * Sync all records marked in kobo_sync table queue
 * The function is designed to be run as a regular cron task (e.g. every 15 mins)
 * TODO - due to function timeout may fail if large amounts of outstanding data
 * TODO - could be refactored to execute on a per-row basis via db trigger
 * TODO - add cron triggers
 * TODO - deploy
 *
 * https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/select-from-table-with-auth-rls/index.ts
 */
serve(async (req: Request) => {
  if (req.method === 'GET') {
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
    return this.client.from('kobo_sync');
  }
  public async run() {
    const pending = await this.listPending();

    // TODO - consider invoking in batches/child functions to avoid timeout
    for (const entry of pending) {
      // deno-lint-ignore prefer-const
      let { _id, operation, enketo_entry, kobo_form_id, kobo_uuid } = entry;
      const kobo_sync_time = new Date().toISOString();
      let res: { status: number | null } = { status: null };
      if (operation === 'UPDATE' || operation === 'CREATE') {
        const { xml } = enketo_entry as any;
        // Create
        if (!kobo_form_id || !kobo_uuid) {
          const { formId, json } = extractSubmissionXML(xml);
          kobo_uuid = json.meta.instanceID.replace('uuid:', '');
          kobo_form_id = formId;
          res = await createKoboSubmission(xml);
          this.results.push({ _id, op: 'CREATE', kobo_uuid, kobo_form_id });
        }
        // Update
        else {
          res = await upsertKoboSubmission(xml);
          this.results.push({ _id, op: 'UPDATE', kobo_uuid, kobo_form_id });
        }
      }
      // Delete (if populated to server)
      if (entry.operation === 'DELETE') {
        if (kobo_form_id && kobo_uuid) {
          res = await deleteKoboSubmissionByUUID(kobo_form_id as string, kobo_uuid as string);
          this.results.push({ _id, op: 'DELETE', kobo_uuid, kobo_form_id });
        } else {
          this.results.push({ _id, op: 'IGNORE' });
        }
      }
      // Patch DB
      // TODO - could include status codes from update
      const kobo_sync_status = res.status;
      await this.table.update({ kobo_form_id, kobo_uuid, kobo_sync_time, kobo_sync_status }).eq('_id', _id);
    }

    return { status: this.status, results: this.results };
  }

  private async listPending() {
    const { data, error } = await this.table.select(`*`, { count: 'exact' }).eq('kobo_sync_required', true);
    return data || [];
  }
}

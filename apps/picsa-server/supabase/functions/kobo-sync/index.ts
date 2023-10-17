// Initialize the JS client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { getClient } from '../_shared/client.ts';
import {
  createKoboSubmission,
  deleteKoboSubmissionByUUID,
  extractSubmissionXML,
  upsertKoboSubmission,
} from '../_kobo/kobo-utils.ts';
import { Database } from '../../types/index.ts';

type TableRecord = Database['public']['Tables']['kobo_sync']['Row'];

type UpdatePayload = {
  type: 'UPDATE';
  table: string;
  schema: string;
  record: TableRecord;
  old_record: TableRecord;
};

/**
 * Sync records marked in kobo_sync table queue
 *
 * When triggered via GET request all outstanding records will be synced (e.g. cron task)
 * When triggered via POST requerst (DB webhook) just the specific record will be synced
 *
 */
serve(async (req: Request) => {
  const koboSync = new KoboSyncHandler(req);

  // When calling via GET request attempt to sync all outstanding entries
  if (req.method === 'GET') {
    const pending = await koboSync.getPending();
    const { results, status } = await new KoboSyncHandler(req).sync(pending);
    return new Response(JSON.stringify(results), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // When calling via POST request (triggered by DB) sync specific row
  if (req.method === 'POST') {
    const payload: UpdatePayload = await req.json();
    const { kobo_sync_required } = payload.record;
    if (kobo_sync_required) {
      const { results, status } = await new KoboSyncHandler(req).sync([payload.record]);
      console.log('handle post request', payload);
      return new Response(JSON.stringify({ results }), { status });
    } else {
      return new Response('Sync not required', { status: 200 });
    }
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
  public async sync(entries: TableRecord[]) {
    // TODO - consider invoking in batches/child functions to avoid timeout
    for (const entry of entries) {
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

  public async getPending() {
    const { data, error } = await this.table.select(`*`, { count: 'exact' }).eq('kobo_sync_required', true);
    return data || [];
  }
}

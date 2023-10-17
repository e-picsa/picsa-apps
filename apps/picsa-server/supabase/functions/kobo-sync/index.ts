// Initialize the JS client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { getClient } from '../_shared/client.ts';
import { deleteKoboSubmissionByUUID, extractSubmissionXML, upsertKoboSubmission } from '../_kobo/kobo-utils.ts';
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
serve((req) => handleRequest(req));

const handleRequest = async (req: Request) => {
  const koboSync = new KoboSyncHandler(req);
  // When calling via GET request attempt to sync all outstanding entries
  if (req.method === 'GET') {
    const pending = await koboSync.getPending();
    const { results, status } = await koboSync.sync(pending);
    return new Response(JSON.stringify(results), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // When calling via POST request (triggered by DB) sync specific row
  if (req.method === 'POST') {
    const payload: UpdatePayload = await req.json();
    // TODO - probably don't need to track sync required anymore
    const { kobo_sync_required } = payload.record;
    if (kobo_sync_required) {
      const { results, status } = await koboSync.sync([payload.record]);
      console.log({ results });
      return new Response(JSON.stringify({ results }), { status });
    } else {
      return new Response('Sync not required', { status: 200 });
    }
  }
  return new Response('Method not supported: ' + req.method, { status: 400 });
};

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
    for (const entry of entries) {
      const { status, message } = await this.syncEntry(entry);
      this.results.push({ status, message, entry });
    }
    // TODO - decide overall status
    return { results: this.results, status: 200 };
  }

  private async syncEntry(entry: TableRecord): Promise<{ status: number | null; message: string | null }> {
    const { _id, operation, enketo_entry } = entry;
    const { xml } = enketo_entry as any;

    // HACK - debounce in case data changed since trigger (e.g. delete triggers update just before)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const { data: latestEntry } = await this.table.select('_modified').eq('_id', _id).single();
    if (latestEntry?._modified !== entry._modified) {
      return { status: 204, message: 'Data changed, skipping' };
    }

    // Handle update
    if (operation === 'UPDATE' || operation === 'CREATE') {
      const { xml } = enketo_entry as any;
      const res = await _internals.upsertKoboSubmission(xml);
      // If created or updated sucessfully remove record from sync queue
      if (res.status === 201 || res.status === 202) {
        await this.table.delete().eq('_id', _id);
      }
      return { status: res.status, message: res.message };
    }

    // Delete (if populated to server)
    if (entry.operation === 'DELETE') {
      const { formId, json } = extractSubmissionXML(xml);
      const res = await _internals.deleteKoboSubmissionByUUID(formId, json.meta.instanceID.replace('uuid:', ''));
      if (res.status === 204) {
        await this.table.delete().eq('_id', _id);
      }
      return { status: res.status, message: res.message };
    }

    return { status: 400, message: `Unknown operation: ${entry.operation}` };
  }

  public async getPending() {
    const { data, error } = await this.table.select(`*`, { count: 'exact' }).eq('kobo_sync_required', true);
    return data || [];
  }
}

/**  Wrap internal handlers for easier testing exposure */
export const _internals = {
  handleRequest,
  deleteKoboSubmissionByUUID,
  upsertKoboSubmission,
};

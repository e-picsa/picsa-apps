import { Injectable } from '@angular/core';
import { RxCollection, RxDocument } from 'rxdb';

import { SupabaseService } from '../supabase.service';

export interface ISupabasePushEntry {
  _supabase_push_status: 'draft' | 'ready' | 'complete' | 'failed';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** Any collection marked as a supabasePushCollection will have metadata fields appended */
// type ISupabasePushCollection = RxCollection<RxJsonSchema<ISupabasePushEntry>>;

/**
 * Simple service to push a replica of data to supabase server
 *
 * TODO - Row level security
 * TODO - managing auth users in app (app_user_id with global user id)
 *
 * NOTE - is single direction push only, for full replication see:
 * https://github.com/marceljuenemann/rxdb-supabase/tree/main
 */
@Injectable({ providedIn: 'root' })
export class PicsaDatabaseSupabasePushService {
  constructor(private supabaseService: SupabaseService) {}

  public registerCollection(collection: RxCollection) {
    this.pushCollectionData(collection);
  }

  private async pushCollectionData(collection: RxCollection) {
    await this.supabaseService.ready();
    // sync existing records
    const docs: RxDocument<ISupabasePushEntry>[] = await collection
      .find({ selector: { $or: [{ _supabase_push_status: 'ready' }, { _supabase_push_status: 'failed' }] } })
      .exec();
    if (docs.length > 0) {
      await this.syncRecords(docs, collection);
    }
    collection.$.subscribe(async (change) => {
      // TODO - update only if ready for submission, maybe debounce
      const { _supabase_push_status } = change.documentData as ISupabasePushEntry;
      if (_supabase_push_status === 'ready' || _supabase_push_status === 'complete') {
        await this.syncRecords([{ _data: change.documentData } as any], collection);
      }
    });
  }

  private async syncRecords(docs: RxDocument<ISupabasePushEntry>[], collection: RxCollection) {
    const records = docs.map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _meta, _rev, _supabase_push_status, ...keptFields } = d._data as ISupabasePushEntry;
      return keptFields;
    });

    const table = this.supabaseService.db.table(collection.name);
    const res = await table.upsert(records);
    if (res.status === 201) {
      // update local collection status where applicatble
      const successUpdate = docs
        .filter((d) => d._data._supabase_push_status !== 'complete')
        .map((d) => {
          d._data._supabase_push_status = 'complete';
          return d._data;
        });
      await collection.bulkUpsert(successUpdate);
    } else {
      const failUpdate = docs
        .filter((d) => d._data._supabase_push_status !== 'failed')
        .map((d) => {
          d._data._supabase_push_status = 'failed';
          return d._data;
        });
      await collection.bulkUpsert(failUpdate);
      console.error({ records, res });
      throw new Error(`Supabase sync fail: [${res.status}] ${res.error?.message}`);
      // TODO - how best to handle errrors? crashlytics?
      // TODO - how best to handle internet issues
      // TODO - how to handle retry - maybe just periodically try main sync method?
    }
  }
}

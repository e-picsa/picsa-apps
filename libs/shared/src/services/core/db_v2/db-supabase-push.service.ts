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
      .find({ selector: { _supabase_push_status: 'ready' } })
      .exec();
    if (docs.length > 0) {
      await this.syncRecords(docs, collection);
    }
    // TODO - subscribe to ongoing changes
    collection.$.subscribe((change) => {
      // TODO - update only if ready for submission, maybe debounce
      // TODO - ensure update on change to reset sync_status
      const before = change.previousDocumentData as ISupabasePushEntry;
      const after = change.documentData as ISupabasePushEntry;
      console.log('doc changed', change);
      if (after._supabase_push_status === 'ready' && before._supabase_push_status !== 'ready') {
        console.log('doc ready to submit', after);
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
      await collection.bulkUpsert(
        docs.map((d) => {
          d._data._supabase_push_status = 'complete';
          return d._data;
        })
      );
    } else {
      console.error({ records, res });
      throw new Error(`Supabase sync fail: [${res.status}] ${res.error?.message}`);
      // TODO - how best to handle errrors? crashlytics?
      // TODO - how best to handle internet issues
    }
  }
}

import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { _wait } from '@picsa/utils';
import { RxCollection, RxDocument } from 'rxdb';

import { SupabaseService } from '../supabase.service';

export interface ISyncPushEntry {
  _sync_push_status: 'draft' | 'ready' | 'complete' | 'failed';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Simple service to push a replica of data to supabase server
 *
 * TODO - managing auth users in app (app_user_id with global user id)
 *
 * NOTE - is single direction push only, for full replication see:
 * https://github.com/marceljuenemann/rxdb-supabase/tree/main
 */
@Injectable({ providedIn: 'root' })
export class PicsaDatabaseSyncService {
  private registeredCollections: Record<string, RxCollection> = {};

  constructor(private supabaseService: SupabaseService) {
    this.subscribeToNetworkChanges();
  }

  /** Register a given collection to have records pushed to supabase db */
  public async registerCollection(collection: RxCollection) {
    if (this.registeredCollections[collection.name]) {
      console.warn('[Supabase Push] Collection already registered: ' + collection.name);
      return;
    }
    await this.supabaseService.ready();
    this.subscribeToCollectionChanges(collection);
    this.registeredCollections[collection.name] = collection;
    await this.syncPendingDocs(collection);
  }

  /**
   * Trigger sync of pending docs
   * NOTE - this will be automatically called on collection register
   * and when network presence detected as online
   * */
  public async syncPendingDocs(collection: RxCollection) {
    await this.supabaseService.ready();
    const docs: RxDocument<ISyncPushEntry>[] = await collection
      .find({ selector: { _sync_push_status: 'ready' } })
      .exec();
    if (docs.length > 0) {
      return this.pushDocsToSupabase(docs, collection);
    } else {
      return { status: 200, msg: 'Already up to date' };
    }
  }

  private syncAllPendingDocs() {
    return Promise.all(
      Object.values(this.registeredCollections).map(async (collection) => {
        await this.syncPendingDocs(collection);
      })
    );
  }

  private subscribeToNetworkChanges() {
    // Initial sync - use timeout to allow time for collections to be registered
    Network.getStatus().then(async ({ connected }) => {
      if (connected) {
        await _wait(2000);
        this.syncAllPendingDocs();
      }
    });
    // Sync when network changes offline -> online
    Network.addListener('networkStatusChange', ({ connected }) => {
      if (connected) {
        this.syncAllPendingDocs();
      }
    });
  }

  private async subscribeToCollectionChanges(collection: RxCollection) {
    collection.$.subscribe(async (change) => {
      // TODO - update only if ready for submission, maybe debounce
      const { _sync_push_status } = change.documentData as ISyncPushEntry;
      if (_sync_push_status === 'ready' || _sync_push_status === 'complete') {
        await this.pushDocsToSupabase([{ _data: change.documentData } as any], collection);
      }
    });
  }

  private async pushDocsToSupabase(docs: RxDocument<ISyncPushEntry>[], collection: RxCollection) {
    const records = docs.map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _meta, _rev, _sync_push_status, ...keptFields } = d._data as ISyncPushEntry;
      return keptFields;
    });
    const table = this.supabaseService.db.table(collection.name);
    const res = await table.upsert(records);
    if (res.status === 201) {
      // update local collection status where applicatble
      const successUpdate = docs
        .filter((d) => d._data._sync_push_status !== 'complete')
        .map((d) => {
          d._data._sync_push_status = 'complete';
          return d._data;
        });
      await collection.bulkUpsert(successUpdate);
    } else {
      // Error cause unknown (e.g. network, conflict, endpoint down etc.)
      // Assume records fine to leave in 'ready' state to re-attempt in future sync
      // Previously 'failed' state included but not very useful as still wants to be synced
      console.error({ records, res });
    }
    return res;
  }
}

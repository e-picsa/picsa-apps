import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { _wait } from '@picsa/utils';
import { RxCollection, RxDatabase, RxDocument } from 'rxdb';

import { SupabaseService } from '../supabase';
import { handleCollectionModifiers } from './db.utils';
import { ISyncDeleteEntry, SYNC_DELETE_COLLECTION } from './schemas/sync_delete';

export interface ISyncPushEntry {
  /** Metadata field to determine sync push actions */
  _sync_push_status: 'draft' | 'ready' | 'complete' | 'failed';
  /** Populated timestamp following successful sync push */
  _sync_push_timestamp?: number;
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

  private db: RxDatabase<{ [key: string]: RxCollection }>;

  /** Track local document deletions in separate collection to sync to server */
  private syncDeleteCollection: RxCollection<ISyncDeleteEntry>;

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Register database for sync service to interact with
   * Creates sync_delete collection to track local deletes to push to server
   */
  public async registerDB(db: RxDatabase<{ [key: string]: RxCollection }>) {
    this.db = db;
    const { collection } = handleCollectionModifiers(SYNC_DELETE_COLLECTION);
    const { sync_delete } = await this.db.addCollections({ sync_delete: collection });
    this.syncDeleteCollection = sync_delete;
    // once db is registered subscribe to network changes to manage syncing
    this.subscribeToNetworkChanges();
  }

  /** Register a given collection to have records pushed to supabase db */
  public async registerCollection(collection: RxCollection) {
    if (!this.db) {
      throw new Error('[Sync Service] DB must be regisered first');
    }
    if (this.registeredCollections[collection.name]) {
      console.warn('[Sync Service] Collection already registered: ' + collection.name);
      return;
    }
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
        this.pushDeletionsToSupabase();
      }
    });
    // Sync when network changes offline -> online
    Network.addListener('networkStatusChange', ({ connected }) => {
      if (connected) {
        this.syncAllPendingDocs();
        this.pushDeletionsToSupabase();
      }
    });
  }

  private async subscribeToCollectionChanges(collection: RxCollection) {
    collection.$.subscribe(async (change) => {
      // Handle document create/update (sync if not marked as draft)
      const { _sync_push_status } = change.documentData as ISyncPushEntry;
      if (_sync_push_status === 'ready' || _sync_push_status === 'complete') {
        await this.pushDocsToSupabase([{ _data: change.documentData } as any], collection);
      }
      // handle doc delete (if previously submitted)
      const { _sync_push_timestamp } = change.documentData as ISyncPushEntry;
      if (change.operation === 'DELETE' && _sync_push_timestamp) {
        const { documentId, collectionName } = change;
        const id = `${collectionName}||${documentId}`;
        await this.syncDeleteCollection.upsert({ collectionName, documentId, id });
        await this.pushDeletionsToSupabase();
      }
    });
  }

  private async pushDeletionsToSupabase() {
    await this.supabaseService.ready();
    const pendingDeleteDocs = await this.syncDeleteCollection.find().exec();
    const ops = pendingDeleteDocs.map(async (doc) => {
      const { collectionName, documentId } = doc._data;
      const table = this.supabaseService.db.table(collectionName);
      const { error } = await table.delete().eq('_id', documentId);
      if (!error) {
        await doc.remove();
      }
    });
    await Promise.all(ops);
    // TODO - might just be easier to track date modified since last successful sync... (?)
    // (would require hooks (?) or write updates )
    // NOTE - doc might not exist in case never synced - hard to track
  }

  private async pushDocsToSupabase(docs: RxDocument<ISyncPushEntry>[], collection: RxCollection) {
    await this.supabaseService.ready();
    const records = docs.map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _meta, _rev, _sync_push_status, _sync_push_timestamp, ...keptFields } = d._data as ISyncPushEntry;
      return keptFields;
    });
    const table = this.supabaseService.db.table(collection.name);
    const res = await table.upsert(records);
    if (res.status === 201 || res.status === 200) {
      // update local collection status where applicatble
      const successUpdate = docs
        .filter((d) => d._data._sync_push_status !== 'complete')
        .map((d) => {
          d._data._sync_push_status = 'complete';
          d._data._sync_push_timestamp = new Date().getTime();
          return d._data;
        });
      await collection.bulkUpsert(successUpdate);
    } else {
      // If failed ensure marked as 'ready' to force future resync of previously 'completed'
      const failUpdate = docs
        .filter((d) => d._data._sync_push_status !== 'ready')
        .map((d) => {
          d._data._sync_push_status = 'ready';
          return d._data;
        });
      await collection.bulkUpsert(failUpdate);
      // Error cause unknown (e.g. network, conflict, endpoint down etc.)
      // Assume records fine to leave in 'ready' state to re-attempt in future sync
      // Previously 'failed' state included but not very useful as still wants to be synced

      // TODO - consider showing `res.error.message` notification (depending on code/reason)
      console.error({ records, res });
    }
    return res;
  }
}

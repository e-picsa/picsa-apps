import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { SupabaseService } from '../supabase/supabase.service';
import { PicsaDatabase_V2_Service } from './db.service';
import { IPicsaCollectionCreator } from './models';

// Import bundled data
// We will need to dynamically import these or have a map
// For now, we'll assume we can access them via a map or direct import
// import * as BundledData from '@picsa/data';

export const SYNC_METADATA_COLLECTION = 'sync_metadata';

export interface ISyncMetadata {
  id: string; // 'global'
  last_sync_timestamp: string | null;
  build_timestamp: string | null;
}

@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private _syncing$ = new BehaviorSubject<boolean>(false);
  public syncing$ = this._syncing$.asObservable();

  constructor(
    private dbService: PicsaDatabase_V2_Service,
    private supabase: SupabaseService,
  ) {}

  public async init(collections: Record<string, IPicsaCollectionCreator<any>>) {
    // 1. Ensure collections exist (including sync_metadata)
    await this.dbService.ensureCollections({
      ...collections,
      [SYNC_METADATA_COLLECTION]: {
        schema: {
          version: 0,
          primaryKey: 'id',
          type: 'object',
          properties: {
            id: { type: 'string', maxLength: 100 },
            last_sync_timestamp: { type: ['string', 'null'] },
            build_timestamp: { type: ['string', 'null'] },
          },
        },
        isUserCollection: false,
      },
    });

    // 2. Check build timestamp and load initial data if needed
    await this.checkAndLoadBundledData();

    // 3. Trigger sync
    this.sync();
  }

  private async checkAndLoadBundledData() {
    const db = this.dbService.db;
    const metaCollection = db.collections[SYNC_METADATA_COLLECTION];
    const meta = await metaCollection.findOne('global').exec();

    // Load build info from generated file (we need to ensure this file exists in the build)
    // For now, we'll try to fetch it from assets or assume it's injected
    let buildInfo = { timestamp: '1970-01-01T00:00:00Z', max_published_at: '1970-01-01T00:00:00Z' };
    try {
      const res = await fetch('assets/data/generated/build-info.json');
      if (res.ok) {
        buildInfo = await res.json();
      }
    } catch (e) {
      console.warn('Could not load build-info.json', e);
    }

    if (!meta) {
      // First run
      await metaCollection.insert({
        id: 'global',
        last_sync_timestamp: buildInfo.max_published_at,
        build_timestamp: buildInfo.timestamp,
      });
      await this.loadBundledData();
    } else {
      // Check if app updated
      if (meta.build_timestamp !== buildInfo.timestamp) {
        console.log('App updated, checking for bundled data updates...');
        await this.mergeBundledData(buildInfo.max_published_at);
        await meta.patch({ build_timestamp: buildInfo.timestamp });
      }
    }
  }

  private async loadBundledData() {
    console.log('Loading initial bundled data...');
    try {
      const res = await fetch('assets/data/generated/data.json');
      if (!res.ok) return;
      const data = await res.json();

      for (const [collectionName, records] of Object.entries(data)) {
        const collection = this.dbService.db.collections[collectionName];
        if (collection) {
          await collection.bulkInsert(records as any[]);
        }
      }
    } catch (e) {
      console.error('Failed to load bundled data', e);
    }
  }

  private async mergeBundledData(bundleMaxPublishedAt: string) {
    console.log('Merging bundled data...');
    try {
      const res = await fetch('assets/data/generated/data.json');
      if (!res.ok) return;
      const data = await res.json();

      for (const [collectionName, records] of Object.entries(data)) {
        const collection = this.dbService.db.collections[collectionName];
        if (collection) {
          // We need to upsert, but only if bundle is newer than local?
          // The plan said:
          // If bundle_record.published_at > local_record.published_at: Update local.
          // Else: Keep local.

          // RxDB bulkUpsert might overwrite. We might need manual check or conflict handler.
          // Simple approach: Fetch all local IDs, compare timestamps.
          // Optimization: Just try upserting all?
          // If we upsert, we overwrite local changes if any (but we assume server authority for this data).
          // The conflict is "User synced newer data" vs "Bundle has older data".
          // So we should ONLY update if bundle.published_at > local.published_at.

          const docs = await collection.find().exec();
          const localMap = new Map(docs.map((d) => [d.primary, d._data]));

          const toUpsert = [];
          for (const record of records as any[]) {
            const local = localMap.get(record[collection.schema.primaryPath]);
            if (!local || !local.published_at || (record.published_at && record.published_at > local.published_at)) {
              toUpsert.push(record);
            }
          }

          if (toUpsert.length > 0) {
            await collection.bulkUpsert(toUpsert);
          }
        }
      }
    } catch (e) {
      console.error('Failed to merge bundled data', e);
    }
  }

  public async sync() {
    if (this._syncing$.value) return;
    this._syncing$.next(true);

    try {
      await this.supabase.ready();
      const meta = await this.dbService.db.collections[SYNC_METADATA_COLLECTION].findOne('global').exec();
      const lastSync = meta?.last_sync_timestamp || '1970-01-01T00:00:00Z';

      const { data, error } = await this.supabase.invokeFunction<Record<string, any[]>>('get_sync_changes', {
        body: { last_sync_timestamp: lastSync },
      });

      if (error) throw error;

      if (data) {
        let maxPublishedAt = lastSync;

        for (const [collectionName, records] of Object.entries(data)) {
          const collection = this.dbService.db.collections[collectionName];
          if (collection && records.length > 0) {
            const toUpsert = [];
            const toRemove = [];

            for (const record of records) {
              if (record.published_at > maxPublishedAt) {
                maxPublishedAt = record.published_at;
              }

              if (record.deleted) {
                toRemove.push(record[collection.schema.primaryPath]);
              } else {
                toUpsert.push(record);
              }
            }

            if (toUpsert.length > 0) await collection.bulkUpsert(toUpsert);
            if (toRemove.length > 0) await collection.bulkRemove(toRemove);
          }
        }

        if (meta) {
          await meta.patch({ last_sync_timestamp: maxPublishedAt });
        }
      }
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      this._syncing$.next(false);
    }
  }
}

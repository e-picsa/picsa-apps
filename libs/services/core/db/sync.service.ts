import { Injectable } from '@angular/core';
import { IDBDoc, IDBEndpoint } from '@picsa/models/db.models';
import { DBCacheService } from './_cache.db';
import { DBServerService } from './_server.db';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DBSyncService {
  private _isSyncing = false;
  public pending$ = new BehaviorSubject<number>(0);
  constructor(private cache: DBCacheService, private server: DBServerService) {
    this.processWrites();
  }

  // add a write to the table of pending writes and process queue
  public async addWrites(endpoint: IDBEndpoint, keys: string[]) {
    const refs: IPendingBatchRef[] = keys.map(_key => {
      return {
        endpoint,
        _key,
        _random: this._generateRandom()
      };
    });
    await this.cache.setDocs('_pendingWrites', refs);
    this.processWrites();
  }

  public async getPendingWrites() {
    const pending = await this.cache.getCollection<IPendingBatchRef>(
      '_pendingWrites'
    );
    this.pending$.next(pending.length);
    return pending;
  }

  // get table of pending writes and process in batch
  // TODO - refactor into smaller chunks
  private async processWrites() {
    if (!this._isSyncing) {
      this._isSyncing = true;
      const pending = await this.getPendingWrites();
      if (pending.length > 0) {
        // retrieve full docs from db
        for (let p of pending) {
          const doc = await this.getDoc(p.endpoint, p._key);
          p.doc = doc;
        }
        // batch write docs
        console.log(`writing [${pending.length}] docs`);
        await this.server.setMultiple(pending as IBatchRef[]);
        console.log(`[${pending.length}] docs written`);
        // retrieve full doc again to check hasn't been updated
        // if no updates remove from pending writes
        const deletableKeys = [];
        for (let p of pending) {
          const latest = await this.getDoc('_pendingWrites', p._key);
          if (latest._random === p._random) {
            deletableKeys.push(p._key);
          }
        }
        await this.cache.deleteDocs('_pendingWrites', deletableKeys);
        this._isSyncing = false;
        return this.processWrites();
      }
      this._isSyncing = false;
    }
  }
  private async getDoc(endpoint: IDBEndpoint, key: string) {
    return this.cache.getDoc<IDBDoc>(endpoint, key);
  }

  private _generateRandom() {
    return (
      Math.random()
        .toString(36)
        .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15)
    );
  }
}

interface IBatchRef extends IPendingBatchRef {
  doc: IDBDoc;
}

interface IPendingBatchRef {
  endpoint: IDBEndpoint;
  doc?: IDBDoc;
  // use both keys and random string. Keys can be overwritten to skip repeated writes,
  // random string unique to check whether what was written. Note, could probably be done with _modified also
  _key: string;
  _random: string;
}

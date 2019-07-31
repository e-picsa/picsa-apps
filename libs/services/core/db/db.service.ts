import { Injectable } from '@angular/core';
import { IDBEndpoint, IDBDoc } from '@picsa/models/db.models';
import DBCacheService from './_cache.db';
import { firestore } from 'firebase/app';
import DBServerService from './_server.db';
import { AbstractDBService } from './abstract.db';

type IDBSource = 'cache' | 'server';
/************************************************************************
 *  The DB Service handles all calls to live and cache databases,
 *  and synchronisation between them. It also handles methods used
 *  when generating mock data
 ***********************************************************************/

/************************************************************************
 *  Main DB Methods (utilises both cache and server DBs)
 ***********************************************************************/
@Injectable({ providedIn: 'root' })
export class PicsaDbService implements AbstractDBService {
  constructor(private cache: DBCacheService, private server: DBServerService) {}
  getCollection<IDBDoc>(endpoint: IDBEndpoint, src: IDBSource = 'cache') {
    return src === 'cache'
      ? this.cache.getCollection<IDBDoc>(endpoint)
      : this.syncCollection<IDBDoc>(endpoint);
  }
  getDoc<IDBDoc>(endpoint: IDBEndpoint, key: string, src: IDBSource = 'cache') {
    return src === 'cache'
      ? this.cache.getDoc<IDBDoc>(endpoint, key)
      : this.syncDoc<IDBDoc>(endpoint, key);
  }
  // when setting any doc update meta and return full doc after complete
  async setDoc<T>(endpoint: IDBEndpoint, doc: T, sync = false) {
    const dbDoc = { ...doc, ...this.generateMeta(doc) };
    if (sync) {
      await this.server.setDoc(endpoint, dbDoc);
    }
    await this.cache.setDoc(endpoint, dbDoc);
    return dbDoc;
  }
  // allow batch set functionality
  async setDocs<T>(
    endpoint: IDBEndpoint,
    docs: T[],
    sync = false
  ): Promise<(T & IDBDoc)[]> {
    const dbDocs = docs.map(doc => {
      return { ...doc, ...this.generateMeta(doc) };
    });
    if (sync) {
      await this.server.setDocs(endpoint, dbDocs);
    }
    await this.cache.setDocs(endpoint, dbDocs);
    return dbDocs;
  }

  /************************************************************************
   *  Sync Methods - invoked after server db calls. Pull from server
   *  save locally and return
   ***********************************************************************/
  private async syncCollection<T>(endpoint: IDBEndpoint) {
    // TODO - add retrieval of latest doc and just query after
    const collection = await this.server.getCollection<T>(endpoint);
    return this.cache.setDocs(endpoint, collection);
  }
  private async syncDoc<T>(endpoint: IDBEndpoint, key: string) {
    // TODO - add retrieval of latest doc and just query after
    const doc = await this.server.getDoc<T>(endpoint, key);
    return this.cache.setDoc<T>(endpoint, doc);
  }

  /************************************************************************
   *  Helper Methods
   ***********************************************************************/

  public generateMeta = (doc: any = {}): IDBDoc => {
    const { _key, _created } = doc;
    return {
      _key: _key ? _key : this._generateKey(),
      _created: _created ? _created : this._toTimestamp(new Date()),
      _modified: this._toTimestamp(new Date())
    };
  };

  private _generateKey = () => {
    const key = firestore()
      .collection('_')
      .doc().id;
    console.log('key', key);
    return key;
  };

  private _toTimestamp = (date?: Date) => {
    return firestore.Timestamp.fromDate(date ? date : new Date());
  };

  // clean data to remove undefined values
  private _cleanData(data: any) {
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'undefined') {
        data[key] = null;
      }
    });
    return data;
  }
}

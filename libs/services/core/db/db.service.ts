import { Injectable } from '@angular/core';
import { IDBEndpoint, IDBDoc } from '@picsa/models/db.models';
import DBCacheService from './_cache.db';
import { firestore } from 'firebase/app';
import DBServerService from './_server.db';
import { AbstractDBService } from './abstract.db';
import { DBSyncService } from './sync.service';
import { ENVIRONMENT } from '@picsa/environments';

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
  constructor(
    private cache: DBCacheService,
    private server: DBServerService,
    private sync: DBSyncService
  ) {}
  getCollection<IDBDoc>(endpoint: IDBEndpoint, src: IDBSource = 'cache') {
    endpoint = this._mapEndpoint(endpoint);
    return src === 'cache'
      ? this.cache.getCollection<IDBDoc>(endpoint)
      : this.server.getCollection<IDBDoc>(endpoint);
  }
  getDoc<IDBDoc>(endpoint: IDBEndpoint, key: string, src: IDBSource = 'cache') {
    endpoint = this._mapEndpoint(endpoint);
    return src === 'cache'
      ? this.cache.getDoc<IDBDoc>(endpoint, key)
      : this.server.getDoc<IDBDoc>(endpoint, key);
  }
  // when setting any doc update meta and return full doc after complete
  // optional sync makes a copy of the document online
  async setDoc<T>(endpoint: IDBEndpoint, doc: T, sync = false) {
    endpoint = this._mapEndpoint(endpoint);
    const dbDoc = { ...doc, ...this.generateMeta(doc) };
    await this.cache.setDoc(endpoint, dbDoc);
    if (sync) {
      this.sync.addWrites(endpoint, [dbDoc._key]);
    }
    return dbDoc;
  }
  // allow batch set functionality
  async setDocs<T>(
    endpoint: IDBEndpoint,
    docs: T[],
    sync = false
  ): Promise<(T & IDBDoc)[]> {
    endpoint = this._mapEndpoint(endpoint);
    const dbDocs = docs.map(doc => {
      return { ...doc, ...this.generateMeta(doc) };
    });
    await this.cache.setDocs(endpoint, dbDocs);
    if (sync) {
      this.sync.addWrites(endpoint, dbDocs.map(d => d._key));
    }
    return dbDocs;
  }
  async deleteDocs(endpoint: IDBEndpoint, keys: string[], deleteServer = true) {
    endpoint = this._mapEndpoint(endpoint);
    await this.cache.deleteDocs(endpoint, keys);
    // NOTE - when client offline this doesn't resolve, so don't wait
    // assume fine if delete action queued assuming will be deleted from client
    // alternatively could add sync methods like doc addition
    if (deleteServer) {
      this.server.deleteDocs(endpoint, keys);
    }
  }

  /************************************************************************
   *  Stream Methods - used to emit local and live updates
   ***********************************************************************/

  async streamCollection() {}
  async streamDoc() {}

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
      _created: _created ? _created : new Date().toISOString(),
      _modified: new Date().toISOString()
    };
  };

  private _generateKey = () => {
    const key = firestore()
      .collection('_')
      .doc().id;
    return key;
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

  // Adjust database endpoint depending on group name
  // done before all db operations.
  private _mapEndpoint(endpoint: IDBEndpoint) {
    const group = ENVIRONMENT.group.code;
    return endpoint.replace('${GROUP}', group) as IDBEndpoint;
  }
}

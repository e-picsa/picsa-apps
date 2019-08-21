import { Injectable } from '@angular/core';
import { IDBEndpoint, IDBDoc } from '@picsa/models/db.models';
import { DBCacheService } from './_cache.db';
import { DBServerService } from './_server.db';
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
  getCollection<IDBDoc>(
    endpoint: IDBEndpoint,
    src: IDBSource = 'cache',
    newerThan: string = ''
  ) {
    endpoint = this._mapEndpoint(endpoint);
    return src === 'cache'
      ? this.cache.getCollection<IDBDoc>(endpoint)
      : this.server.getCollection<IDBDoc>(endpoint, newerThan);
  }
  getDoc<IDBDoc>(endpoint: IDBEndpoint, key: string, src: IDBSource = 'cache') {
    endpoint = this._mapEndpoint(endpoint);
    return src === 'cache'
      ? this.cache.getDoc<IDBDoc>(endpoint, key)
      : this.server.getDoc<IDBDoc>(endpoint, key);
  }
  // when setting any doc update meta and return full doc after complete
  // optional sync makes a copy of the document online
  async setDoc<T>(
    endpoint: IDBEndpoint,
    doc: T,
    sync = false,
    keepModified = false
  ) {
    endpoint = this._mapEndpoint(endpoint);
    const dbDoc = { ...doc, ...generateDBMeta(doc, keepModified) };
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
    sync = false,
    keepModified = false
  ): Promise<(T & IDBDoc)[]> {
    endpoint = this._mapEndpoint(endpoint);
    const dbDocs = docs.map(doc => {
      const meta = generateDBMeta(doc, keepModified);
      return { ...doc, ...meta };
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
   *  Currently handled within individual stores
   ***********************************************************************/

  // async streamCollection() {}
  // async streamDoc() {}

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

/************************************************************************
 *  Additional exports - available without injection
 ***********************************************************************/
export const generateDBMeta = (
  doc: any = {},
  // sometimes we want to keep the modification date such as loading hardcoded data
  keepModified = false
): IDBDoc => {
  const { _key, _created, _modified } = doc;
  return {
    _key: _key ? _key : _generateID(),
    _created: _created ? _created : new Date().toISOString(),
    _modified: keepModified && _modified ? _modified : new Date().toISOString()
  };
};

// taken from firestore generation methods
// https://github.com/firebase/firebase-js-sdk/blob/73a586c92afe3f39a844b2be86086fddb6877bb7/packages/firestore/src/util/misc.ts#L36
function _generateID() {
  // Alphanumeric characters
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

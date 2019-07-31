import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { IDBEndpoint, IDBDoc } from '@picsa/models/db.models';
import { AbstractDBService } from './abstract.db';

const DB_VERSION = 1;
const db = new Dexie('PICSA_Apps');
@Injectable({ providedIn: 'root' })
class DBCacheService implements AbstractDBService {
  /************************************************************************
   *  Main Methods
   ***********************************************************************/
  public async getCollection<T>(endpoint: IDBEndpoint): Promise<T[]> {
    console.log('getting collection', endpoint);
    await this.ensureExists(endpoint);
    // if no data will throw error
    try {
      const collection = await db.table<T>(endpoint).toArray();
      return collection;
    } catch (error) {
      return [];
    }
  }

  // NOTE - if no doc found will return undefined
  public async getDoc<IDBDoc>(
    endpoint: IDBEndpoint,
    key: string
  ): Promise<IDBDoc | undefined> {
    await this.ensureExists(endpoint);
    try {
      const doc = await db.table<IDBDoc>(endpoint).get(key);
      return doc;
    } catch (error) {
      return undefined;
    }
  }
  public async setDoc<T>(endpoint: IDBEndpoint, doc: T & IDBDoc) {
    await this.ensureExists(endpoint);
    await db.table(endpoint).put(doc);
    return doc;
  }

  public async setDocs<T>(endpoint: IDBEndpoint, docs: (T & IDBDoc)[]) {
    await this.ensureExists(endpoint);
    if (!db.hasOwnProperty(endpoint)) {
      await this.loadStores({ [endpoint]: DEFAULT_STORE_SCHEMA });
    }
    await db.table(endpoint).bulkPut(docs);
    return docs;
  }

  /************************************************************************
   *  Helper Methods
   ***********************************************************************/

  //  Dexie throws errors if tables have not been initialised
  private async ensureExists(endpoint: IDBEndpoint) {
    if (!db.hasOwnProperty(endpoint)) {
      await this.loadStores({ [endpoint]: DEFAULT_STORE_SCHEMA });
    }
  }
  // initialise database stores
  private async loadStores(stores: IDBStores) {
    const schema = {};
    for (let [key, value] of Object.entries(stores)) {
      schema[key] = value ? value : DEFAULT_STORE_SCHEMA;
    }
    await db.version(DB_VERSION).stores(schema);
  }
}

type IDBStores = { [endpoint in IDBEndpoint]?: string | null };

// Dexie stores require schema for indexing. By default pass keys populated on dbdocs
const DEFAULT_STORE_SCHEMA = '_key,_created,_modified';

export default DBCacheService;

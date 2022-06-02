import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { IDBEndpoint, IDBDoc, DB_SCHEMA, DB_VERSION } from '@picsa/models';
import { upgradeDatabases } from './_cache.upgrade.db';
import { AbstractDBService } from './abstract.db';
import { ENVIRONMENT } from '@picsa/environments';

// multiple possible databases for different groups
// TODO - handle group changes
const db = new Dexie(`PICSA_Apps_${ENVIRONMENT.group.code}`);
@Injectable({ providedIn: 'root' })
export class DBCacheService implements AbstractDBService {
  constructor() {
    // initialise database stores, NOTE - avoid dynamically adding tables
    // instead, provide upgrade for changing structure
    // https://github.com/dfahlander/Dexie.js/issues/684
    upgradeDatabases(db);
    db.version(DB_VERSION).stores(DB_SCHEMA);
  }
  /************************************************************************
   *  Main Methods - taken from abstract class
   ***********************************************************************/
  public async getCollection<T>(endpoint: IDBEndpoint): Promise<T[]> {
    // if no data will throw error
    try {
      const collection = await db.table<T>(endpoint).toArray();
      console.log(endpoint, collection);
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
    try {
      const doc = await db.table<IDBDoc>(endpoint).get(key);
      return doc;
    } catch (error) {
      return undefined;
    }
  }
  public async getDocs(endpoint: IDBEndpoint, keys: string[]) {
    return db.table(endpoint).where('_key').anyOf(keys);
    // NOTE, above query can be replaced when dexie 3 released
    // return db.table(endpoint).bulkGet(keys)
  }
  public async setDoc<T>(endpoint: IDBEndpoint, doc: T) {
    await db.table(endpoint).put(doc);
    return doc as T & IDBDoc;
  }

  public async setDocs<T>(endpoint: IDBEndpoint, docs: T[]) {
    await db.table(endpoint).bulkPut(docs);
    // force type as doc not always IDBDoc (e.g. pending writes)
    return docs as (T & IDBDoc)[];
  }

  public async deleteDocs(endpoint: IDBEndpoint, keys: string[]) {
    return db.table(endpoint).bulkDelete(keys);
  }

  /************************************************************************
   *  Additional Methods - specific only to cache db
   ***********************************************************************/
}

// export default DBCacheService;
export const cached_db = db;

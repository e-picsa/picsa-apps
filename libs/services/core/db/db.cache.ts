import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { IDBEndpoint, IDBDoc } from '@picsa/models/db.models';

const DB_VERSION = 1;
const db = new Dexie('PICSA_Apps');
@Injectable({ providedIn: 'root' })
export class DBCacheService {
  constructor() {
    console.log('db cache constructor');
  }
  // initialise database stores
  public async loadStores(stores: IDBStores) {
    const schema = {};
    for (let [key, value] of Object.entries(stores)) {
      schema[key] = value ? value : DEFAULT_STORE_SCHEMA;
    }
    await db.version(DB_VERSION).stores(schema);
  }

  public async getCollection<T extends IDBDoc>(
    endpoint: IDBEndpoint
  ): Promise<T[]> {
    console.log('getting collection', endpoint);
    if (!db.hasOwnProperty(endpoint)) {
      await this.loadStores({ [endpoint]: DEFAULT_STORE_SCHEMA });
    }
    return db.table<T>(endpoint).toArray();
  }

  // NOTE - if no doc found will return undefined
  public async getDoc<T extends IDBDoc>(
    endpoint: IDBEndpoint,
    key: string
  ): Promise<T | undefined> {
    return db.table<T>(endpoint).get(key);
  }

  public async isEmpty(endpoint: IDBEndpoint) {
    const length = await db.table(endpoint).count();
    return length === 0;
  }

  public async setDoc(endpoint: IDBEndpoint, doc: IDBDoc) {
    return db.table(endpoint).put(doc);
  }

  public async setDocs(endpoint: IDBEndpoint, docs: IDBDoc[]) {
    if (!db.hasOwnProperty(endpoint)) {
      await this.loadStores({ [endpoint]: DEFAULT_STORE_SCHEMA });
    }
    await db.table(endpoint).bulkPut(docs);
  }
}

type IDBStores = { [endpoint in IDBEndpoint]?: string | null };

// Dexie stores require schema for indexing. By default pass keys populated on dbdocs
const DEFAULT_STORE_SCHEMA = '_key,_created,_modified';

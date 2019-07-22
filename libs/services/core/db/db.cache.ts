import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { IDBEndpoint } from '@picsa/models/db.models';

const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class DBCacheService {
  private db = new Dexie('PICSA_Apps');
  constructor() {}

  // initialise database stores
  async loadStores(stores: IDBStores) {
    const schema = {};
    for (let [key, value] of Object.entries(stores)) {
      schema[key] = value ? value : DEFAULT_STORE_SCHEMA;
    }
    await this.db.version(DB_VERSION).stores(schema);
  }
}

type IDBStores = { [endpoint in IDBEndpoint]?: string | null };

// Dexie stores require schema for indexing. By default pass keys populated on dbdocs
const DEFAULT_STORE_SCHEMA = '_key,_created,_modified';

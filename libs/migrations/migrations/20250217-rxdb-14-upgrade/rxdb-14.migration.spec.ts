/**
 *
 * TODO
 * These specs have become outdated, however still contain some useful snippets
 * for testing in general. They could be adapted in the future when new migrations added
 *
 */

import migrate from './rxdb-14.migration';

// HACK
global.structuredClone = (v) => JSON.parse(JSON.stringify(v));

import crypto from 'crypto';

import { MockPicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2/db.service.mock.spec';

Object.defineProperty(globalThis, 'crypto', { value: { subtle: crypto.subtle } });

// TODO - need web test runner (karma) or possibly try as e2e test

/***************************************************************************************
 * Test Setup
 **************************************************************************************/

async function seedMockDB<T extends { id: string }>(name: string, data: T[] = []) {
  const db = await createDB(name);
  await putMockDBData(db, data);
  return db;
}

async function createDB(name: string) {
  return new Promise<IDBDatabase>((resolve) => {
    const req = indexedDB.open(name, 10);
    // create a mock 'docs' object store for storing entries
    req.onupgradeneeded = async () => {
      const db = req.result;
      db.createObjectStore('docs', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function putMockDBData<T extends { id: string }>(db: IDBDatabase, data: T[]) {
  return new Promise<IDBTransaction>((resolve) => {
    const transaction = db.transaction(['docs'], 'readwrite');
    transaction.oncomplete = () => {
      resolve(transaction);
    };
    const objectStore = transaction.objectStore('docs');
    for (const el of data) {
      const req = objectStore.put(el);
      req.onsuccess = () => console.log('put data', el);
    }
  });
}

/***************************************************************************************
 * Test Methods
 **************************************************************************************/

/**
 * Call standalone tests via:
 * yarn nx test shared --test-file=libs/shared/src/services/core/db_v2/db-migration.utils.spec.ts
 */
describe('PicsaDataMigrationmigration', () => {
  beforeEach(async () => {
    const dbService = new MockPicsaDatabase_V2_Service();
  });

  it('should be created', async () => {
    expect(dbMigration).toBeTruthy();
  });
  it('mock idb puts data', async () => {
    await seedMockDB('test_legacy_db', [{ id: '1', string: 'hello' }]);
    const data = await dbMigration['getLegacyDocs']('test_legacy_db');
    expect(data).toEqual([{ id: '1', value: 2 }]);
  });

  it('lists legacy dbs', async () => {
    await seedMockDB('rxdb-dexie-picsa_app--0--mock_tool');
    await dbMigration['loadLegacyDBMeta']();
    expect(dbMigration['legacyDBs']).toEqual({
      mock_tool: {
        dbName: 'rxdb-dexie-picsa_app--0--mock_tool',
        rxdbVersion: 14,
        schemaVersion: 0,
      },
    });
  });
  it('omits legacy schema if already migrated', async () => {
    // should only create migration for --1-- schema
    await seedMockDB('rxdb-dexie-picsa_app--0--mock_tool');
    await seedMockDB('rxdb-dexie-picsa_app--1--mock_tool');
    await dbMigration['loadLegacyDBMeta']();
    expect(dbMigration['legacyDBs']).toEqual({
      mock_tool: {
        dbName: 'rxdb-dexie-picsa_app--1--mock_tool',
        rxdbVersion: 14,
        schemaVersion: 1,
      },
    });
  });
  it('omits current dbs from migration', async () => {
    // assuming current rxdb version 16 - omit `_16` namespaced
    await seedMockDB('rxdb-dexie-picsa_app_16--0--mock_tool');
    await dbMigration['loadLegacyDBMeta']();
    expect(dbMigration['legacyDBs']).toEqual({});
  });

  it.only('...', async () => {
    const legacyDB = await seedMockDB('rxdb-dexie-picsa_app--0--mock_tool', [{ id: '1', string: 'hello' }]);

    dbMigration.migrate('mock_db', {
      version: 0,
      type: 'object',
      primaryKey: 'id',
      properties: { id: { type: 'string' } },
      required: ['id'],
    });
  });

  it('collection create triggers legacy migration', async () => {
    // const legacyDB = await seedMockDB('rxdb-dexie-picsa_app--0--mock_tool', [{ id: '1', string: 'hello' }]);
    // NOTE - cannot add due to PrematureCommitError (seems to only be in jest env)
    // await dbService.ensureCollections({
    //   mock_tool: {
    //     isUserCollection: false,
    //   },
    // });
    // console.log('collections', dbService.db.collections);
    // expect(true).toEqual(true);
  });
});

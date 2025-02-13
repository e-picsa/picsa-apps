import { createRxDatabase, RxCollection, RxDatabase } from 'rxdb';
import { AfterMigrateBatchHandlerInput, migrateStorage } from 'rxdb/plugins/migration-storage';
import { getRxStorageDexie as StorageDexie_v16 } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { getRxStorageDexie as StorageDexie_v14 } from 'rxdb-14/plugins/storage-dexie';

/**
 * Handle creation of DB and migration of older versions
 * https://rxdb.info/migration-storage.html?console=storage
 */

export async function createDB() {
  const db: RxDatabase<{
    [key: string]: RxCollection;
  }> = await createRxDatabase({
    name: `picsa_app_16`,
    storage: wrappedValidateAjvStorage({ storage: StorageDexie_v16({ autoOpen: true }) }),
    // hashFunction: (s) => md5hash(s).toString(),
    // TODO - want to use md5 hashfunction but would need to migrate all collections
    // import md5hash from 'crypto-js/md5';
  });

  //   Migrate rxdb-14 storage (app version < 3.50.0 )
  await migrateStorage({
    database: db as any,
    /**
     * Name of the old database,
     * using the storage migration requires that the
     * new database has a different name.
     */
    oldDatabaseName: 'picsa_app',
    oldStorage: StorageDexie_v14(), // RxStorage of the old database
    batchSize: 500,
    parallel: false,
    afterMigrateBatch: (input: AfterMigrateBatchHandlerInput) => {
      console.log('storage migration: batch processed');
    },
  });

  return db;
}

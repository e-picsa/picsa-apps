import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments/src';
import md5 from 'crypto-js/md5';
import { addRxPlugin, createRxDatabase, MangoQuerySelector, nativeSha256, RxCollection, RxDatabase } from 'rxdb';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import { PicsaAsyncService } from '../../asyncService.service';
import { PicsaUserService } from '../user.service';
import { IDBCollectionName } from './db.types';
import { handleCollectionModifiers } from './db.utils';
import { PicsaDatabaseSyncService } from './db-sync.service';
import { IPicsaCollectionCreator } from './models';

/**
 * DB service that utilises RXDB to provide live-query collections
 * and persisted data to indexeddb (via dexie)
 *
 * https://rxdb.info/rx-database.html
 */
@Injectable({ providedIn: 'root' })
export class PicsaDatabase_V2_Service extends PicsaAsyncService {
  public override initOnCreate = true;
  public db: RxDatabase<{
    [key: string]: RxCollection;
  }>;

  constructor(private userService: PicsaUserService, private syncService: PicsaDatabaseSyncService) {
    super();
  }

  /**
   * Initialise the database
   * @note This is called automatically when importing the module and so should
   * not be manually triggered
   */
  public override async init() {
    // TODO - should create custom attachments plugin that handles native/opfs file storage
    addRxPlugin(RxDBAttachmentsPlugin);
    addRxPlugin(RxDBMigrationSchemaPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    // NOTE - do not use dev-mode. It blocks usage of fields starting with `_`, which is still permissable in production

    // if (isDevMode()) {
    //   await import('rxdb/plugins/dev-mode').then((module) => addRxPlugin(module.RxDBDevModePlugin));
    // }
    const dexieStorage = getRxStorageDexie({ autoOpen: true });

    // HACK - if running locally but via ip 192.168.xx or 127.0.0.1 (e.g. native serve), then browser will not
    // be able to access native crypto for hash. Use fallback
    // https://github.com/pubkey/rxdb/issues/6765
    const md5HashFunction = async (s: string) => md5(s).toString();

    this.db = await createRxDatabase({
      name: `picsa_app_16`,
      // when running in production do not validate data (expense op and could lead to accidental data loss)
      storage: ENVIRONMENT.production ? dexieStorage : wrappedValidateAjvStorage({ storage: dexieStorage }),
      hashFunction: location.host.startsWith('192') ? md5HashFunction : nativeSha256,
      // TODO - want to use md5 hashfunction for all but would require migrate all collections
      // (would also need to compare performance when hashing large video files)
    });

    await this.syncService.registerDB(this.db);
  }

  /** Call method to register db collection, avoiding re-register duplicate collection */
  public async ensureCollections(collections: { [name in IDBCollectionName]?: IPicsaCollectionCreator<any> }) {
    for (const [name, picsaCollection] of Object.entries(collections)) {
      if (name in this.db.collections) {
        console.warn('Duplicate collection skipped:', name);
      } else {
        // apply custom collection modifiers
        const { collection, hookFactories } = handleCollectionModifiers(picsaCollection);

        // register colleciton
        await this.db.addCollections({ [name]: collection });
        const createdCollection = this.db.collections[name];

        // apply custom collection hooks
        for (const hookFactory of hookFactories) {
          hookFactory(createdCollection);
        }

        // register sync push
        if (picsaCollection.syncPush) {
          this.syncService.registerCollection(createdCollection);
        }
      }
    }
  }

  /**
   * Utility method to take a collection and filter entries for active user
   * In case no active profile loaded will return all data
   * NOTE - the collection must be marked with `isUserCollection: true` to work
   * */
  public activeUserQuery<T>(collection: RxCollection<T>, query: MangoQuerySelector<T> = {}) {
    // Only filter when multiple user profiles exist so that any disassociated data
    // still displays for single user case after delete
    if (Object.keys(this.userService.allUsersHashmap).length > 1) {
      const _app_user_id = this.userService.activeUser$.value._id;
      // TODO - handle live switch in case user id changes
      return collection.find({ selector: { _app_user_id, ...query } as any });
    } else {
      return collection.find({ selector: query });
    }
  }
}

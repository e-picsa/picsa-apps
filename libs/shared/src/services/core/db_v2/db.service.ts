import { Injectable } from '@angular/core';
import { addRxPlugin, createRxDatabase, MangoQuerySelector, RxCollection, RxDatabase } from 'rxdb';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { PicsaAsyncService } from '../../asyncService.service';
import { PicsaUserService } from '../user.service';
import { PicsaDatabaseSyncService } from './db-sync.service';
import { IPicsaCollectionCreator } from './models';

addRxPlugin(RxDBAttachmentsPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

interface IUserCollectionData {
  _app_user_id?: string;
}

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
    this.db = await createRxDatabase({
      name: `picsa_app`,
      storage: getRxStorageDexie({ autoOpen: true }),
      // hashFunction: (s) => md5hash(s).toString(),
      // TODO - want to use md5 hashfunction but would need to migrate all collections
      // import md5hash from 'crypto-js/md5';
    });
    await this.syncService.registerDB(this.db);
  }

  /** Call method to register db collection, avoiding re-register duplicate collection */
  public async ensureCollections(collections: { [name: string]: IPicsaCollectionCreator<any> }) {
    for (const [name, picsaCollection] of Object.entries(collections)) {
      if (name in this.db.collections) {
        console.warn('Duplicate collection skipped:', name);
      } else {
        // apply custom collection modifiers
        const { collection, hookFactories } = this.handleCollectionModifiers(picsaCollection);

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

  /**
   * Handle custom PICSA DB modifiers
   */
  private handleCollectionModifiers(picsaCollection: IPicsaCollectionCreator<any>) {
    const { isUserCollection, syncPush, ...collection } = picsaCollection;
    const hookFactories: ((c: RxCollection) => void)[] = [];
    // store app user ids in any collections marked with `isUserCollection`
    // user information is stored in localStorage instead of db to avoid circular dependency issues
    if (isUserCollection) {
      collection.schema.properties['_app_user_id'] = { type: 'string' };
      hookFactories.push((c) => {
        const fn = (data: IUserCollectionData) => (data._app_user_id = this.userService.activeUser$.value._id);
        c.addHook('pre', 'save', fn);
        c.addHook('pre', 'insert', fn);
      });
    }
    // If collection pushed to server db store _sync_push_status
    if (syncPush) {
      collection.schema.properties['_sync_push_status'] = { type: 'string' };
    }
    return { collection, hookFactories };
  }
}

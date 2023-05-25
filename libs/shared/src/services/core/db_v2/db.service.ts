import { Injectable } from '@angular/core';
import { addRxPlugin, createRxDatabase, RxCollection, RxCollectionCreator, RxDatabase } from 'rxdb';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
addRxPlugin(RxDBMigrationPlugin);

/** When creating collections for PICSA db additional fields required to determine how to handle */
export interface IPicsaCollectionCreator<T> extends RxCollectionCreator<T> {
  /** User collections will append app user id to all entries */
  isUserCollection: boolean;
}
interface IPicsaCollectionData {
  _app_user_id?: string;
}

/**
 * DB service that utilises RXDB to provide live-query collections
 * and persisted data to indexeddb (via dexie)
 *
 * https://rxdb.info/rx-database.html
 */
@Injectable({ providedIn: 'root' })
export class PicsaDatabase_V2_Service {
  private _init_called = false;

  public db: RxDatabase<{
    [key: string]: RxCollection;
  }>;

  public get dbUserId() {
    // TODO - return from user service
    return '_default_';
  }

  /**
   * Call method to register db collection, avoiding re-register duplicate collection
   */
  public async ensureCollections(collections: { [name: string]: IPicsaCollectionCreator<any> }) {
    for (const [name, picsaCollection] of Object.entries(collections)) {
      if (name in this.db.collections) {
        console.warn('Duplicate collection skipped:', name);
      } else {
        // create collection
        const { isUserCollection, ...collection } = picsaCollection;
        if (isUserCollection) {
          collection.schema.properties['_app_user_id'] = { type: 'string' };
        }
        await this.db.addCollections({ [name]: collection });
        // handle custom picsa collection hooks
        const createdCollection = this.db.collections[name];
        this.addCollectionHooks(createdCollection, { isUserCollection });
      }
    }
  }

  /**
   * Initialise the database
   * @note This is called automatically when importing the module and so should
   * not be manually triggered
   */
  public async initialise() {
    // Avoid duplicate initialisation
    // Shouldn't happen as init called in forRoot but just in case
    if (!this._init_called) {
      this._init_called = true;
      this.db = await createRxDatabase({
        name: `picsa_app`,
        storage: getRxStorageDexie({ autoOpen: true }),
      });
    }
  }

  private addCollectionHooks(collection: RxCollection, options: { isUserCollection: boolean }) {
    const { isUserCollection } = options;
    if (isUserCollection) {
      collection.addHook('pre', 'save', (data: IPicsaCollectionData) => (data._app_user_id = this.dbUserId));
    }
  }
}

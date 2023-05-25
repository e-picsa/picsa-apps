import { Injectable } from '@angular/core';
import { createRxDatabase, RxCollection, RxCollectionCreator, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

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

  /**
   * Call method to register db collection, avoiding re-register duplicate collection
   */
  public async ensureCollections(collections: { [name: string]: RxCollectionCreator }) {
    for (const [name, collection] of Object.entries(collections)) {
      if (name in this.db.collections) {
        console.warn('Duplicate collection skipped:', name);
      } else {
        await this.db.addCollections({ [name]: collection });
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
}

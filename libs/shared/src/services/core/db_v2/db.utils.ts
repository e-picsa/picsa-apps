import { RxCollection } from 'rxdb';

import { ACTIVE_USER_STORAGE_NAME } from '../user.service';
import { IPicsaCollectionCreator } from './models';

interface IUserCollectionData {
  _app_user_id: string | null;
}

/**
 * Handle custom PICSA DB modifiers
 */
export function handleCollectionModifiers(picsaCollection: IPicsaCollectionCreator<any>) {
  const { isUserCollection, syncPush, ...collection } = picsaCollection;
  const hookFactories: ((c: RxCollection) => void)[] = [];

  // ensure all collections include maxLength with primary key (rxdb 16 requirement)
  const { primaryKey, properties } = collection.schema;
  if (!properties[primaryKey as string].maxLength) {
    collection.schema.properties[primaryKey as string].maxLength = 1024;
  }

  // store app user ids in any collections marked with `isUserCollection`
  // user information is stored in localStorage instead of db to avoid circular dependency issues
  if (isUserCollection) {
    collection.schema.properties['_app_user_id'] = { type: 'string' };
    hookFactories.push((c) => {
      const fn = (data: IUserCollectionData) => {
        data._app_user_id = localStorage.getItem(ACTIVE_USER_STORAGE_NAME);
      };
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

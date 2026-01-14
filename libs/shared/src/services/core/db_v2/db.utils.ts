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
  const { primaryKey, properties, required = [] } = collection.schema;
  if (!properties[primaryKey as string].maxLength) {
    collection.schema.properties[primaryKey as string].maxLength = 1024;
  }

  // add support for attachments by default
  collection.attachments ??= {};

  // remove `null` values to pass schema check on non-required fields
  hookFactories.push((c) => {
    c.addHook('pre', 'insert', (data: Record<string, any>) => removeNullValues(data));
  });

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
  // If collection pulled from server db store published_at and deleted
  if (picsaCollection.syncPull) {
    collection.schema.properties['published_at'] = { type: ['string', 'null'] };
    collection.schema.properties['deleted'] = { type: 'boolean' };
  }
  return { collection, hookFactories };
}

function removeNullValues(data: Record<string, any>) {
  if (isObjectLiteral(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (value === null) {
        delete data[key];
      }
      if (isObjectLiteral(value)) {
        data[key] = removeNullValues(value);
      }
    }
  }
  return data;
}

function isObjectLiteral(v: any) {
  return v ? v.constructor === {}.constructor : false;
}

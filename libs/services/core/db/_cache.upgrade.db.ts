// important, every version in use needs to be exposed and upgrade provided
import {
  DB_VERSION,
  keyReplace,
  DEFAULT_STORE_SCHEMA,
} from '@picsa/models/db.models';
import Dexie from 'dexie';
import { ENVIRONMENT } from '@picsa/environments';

// import existing open DB to ensure working with db of same name
// interate over any previous db version, opening and providing data upgrade
// see more info at: https://dexie.org/docs/Tutorial/Design#database-versioning

// note, only need to upgrade if planning to keep store in use, most cases happy just
// to pull data new
export const upgradeDatabases = (db: Dexie) => {
  for (let i = 1; i < DB_VERSION; i++) {
    const stores = LEGACY_STORES[i];
    const upgrade = UPGRADES[i];
    if (LEGACY_STORES[i]) {
      db.version(i)
        .stores(keyReplace(stores, '${GROUP}', ENVIRONMENT.group.code))
        .upgrade((tx) => upgrade(tx));
    }
  }
};

// changes to stores should be kept here
// note - should be kept as long as chance user has in browser
const LEGACY_STORES = {
  1: {
    _pendingWrites: DEFAULT_STORE_SCHEMA,
    _appMeta: '_key',
    budgetTool: '_key',
    'budgetTool/_all/cards': '_key,type',
    climateTool: DEFAULT_STORE_SCHEMA,
    forms: DEFAULT_STORE_SCHEMA,
    stationData: DEFAULT_STORE_SCHEMA,
    'budgetTool/${GROUP}/budgets': DEFAULT_STORE_SCHEMA,
  },
  // added user store
  get 2() {
    return { ...this['1'], 'users/${GROUP}/users': DEFAULT_STORE_SCHEMA };
  },
};

// modifications within stores should be kept here
const UPGRADES = {
  1: (tx) => null,
  2: (tx) => null,
};

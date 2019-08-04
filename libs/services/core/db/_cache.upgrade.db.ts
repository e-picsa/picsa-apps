// important, every version in use needs to be exposed and upgrade provided
import {
  DB_VERSION,
  DEFAULT_STORE_SCHEMA,
  keyReplace
} from '@picsa/models/db.models';
import Dexie from 'dexie';
import { ENVIRONMENT } from '@picsa/environments';

// import existing open DB to ensure working with db of same name
// interate over any previous db version, opening and providing data upgrade
// see more info at: https://dexie.org/docs/Tutorial/Design#database-versioning
export const upgradeDatabases = (db: Dexie) => {
  for (let i = 1; i < DB_VERSION; i++) {
    console.log('upgrading database', i);
    db.version(i)
      .stores(
        keyReplace(LEGACY_STORES[i].stores, '${GROUP}', ENVIRONMENT.group.code)
      )
      .upgrade(tx => {
        return LEGACY_STORES[i].upgrade(tx);
      });
  }
};

const LEGACY_STORES: ILegacyStore = {
  1: {
    stores: {
      _pendingWrites: DEFAULT_STORE_SCHEMA,
      budgetTool: DEFAULT_STORE_SCHEMA,
      'budgetTool/_all/cards': DEFAULT_STORE_SCHEMA + 'TODO-cardType',
      climateTool: DEFAULT_STORE_SCHEMA,
      forms: DEFAULT_STORE_SCHEMA,
      stationData: DEFAULT_STORE_SCHEMA,
      'budgetTool/${GROUP}/budgets': DEFAULT_STORE_SCHEMA
    }
  }
};

interface ILegacyStore {
  [index: number]: {
    stores: any;
    upgrade?: (tx: Dexie.Transaction) => void;
  };
}

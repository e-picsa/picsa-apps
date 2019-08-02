import { firestore } from 'firebase/app';

// note, as most db writes are within nested collections hard to assert strong typings without
// also lots of nested methods (e.g. setSubDoc, getSubCollectionEtc)
// type below is mostly for reference
const DEFAULT_STORE_SCHEMA = '_key,_modified';

export const DB_VERSION = 1;
// NOTE - changes to list of tables requires update db version
// changes within table schema (including fields) require upgrade function

const DB_COMMON_SCHEMA = {
  _pendingWrites: DEFAULT_STORE_SCHEMA,
  budgetTool: DEFAULT_STORE_SCHEMA,
  climateTool: DEFAULT_STORE_SCHEMA,
  forms: DEFAULT_STORE_SCHEMA,
  stationData: DEFAULT_STORE_SCHEMA
  // 'budgetTool/meta/activities': DEFAULT_STORE_SCHEMA,
  // 'budgetTool/meta/inputs': DEFAULT_STORE_SCHEMA,
  // 'budgetTool/meta/outputs': DEFAULT_STORE_SCHEMA,
  // 'budgetTool/meta/familyLabour': DEFAULT_STORE_SCHEMA,
  // 'budgetTool/meta/enterpriseTypes': DEFAULT_STORE_SCHEMA,
  // 'budgetTool/meta/enterprises': DEFAULT_STORE_SCHEMA,
};
const DB_GROUP_SCHEMA = {
  'budgetTool/${GROUP}/budgets': DEFAULT_STORE_SCHEMA
};

export const DB_SCHEMA = {
  ...DB_COMMON_SCHEMA,
  ...DB_GROUP_SCHEMA
};

export type IDBEndpoint = keyof typeof DB_SCHEMA;

export interface ITimestamp extends firestore.Timestamp {}
export interface IDBDoc {
  _key: string;
  _created: ITimestamp;
  _modified: ITimestamp;
  [key: string]: any;
}

import { firestore } from 'firebase/app';
import { ENVIRONMENT } from '@picsa/environments';

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

// replace group variable with group code from environment and export collated endpoint schema
export const DB_SCHEMA = {
  ...DB_COMMON_SCHEMA,
  ...keyReplace(DB_GROUP_SCHEMA, '${GROUP}', ENVIRONMENT.group.code)
};

export type IDBEndpoint = keyof typeof DB_SCHEMA;

export interface ITimestamp extends firestore.Timestamp {}
export interface IDBDoc {
  _key: string;
  _created: ITimestamp;
  _modified: ITimestamp;
  [key: string]: any;
}

function keyReplace(
  obj: { [key: string]: string },
  searchVal: string,
  replaceVal: string
) {
  const rep = {};
  Object.keys(obj).forEach(
    k => (rep[k.replace(searchVal, replaceVal)] = obj[k])
  );
  console.log('replaced', rep);
  return rep;
}

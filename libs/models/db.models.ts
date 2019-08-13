import { ENVIRONMENT } from '@picsa/environments';

// schemas create indexes on the database
// as datasets typically quite small these aren't really required, but probably good practice
export const DEFAULT_STORE_SCHEMA = '_key,_modified';

export const DB_VERSION = 2;
// NOTE - changes to list of tables requires update db version
// changes within table schema (including fields) require upgrade function

const DB_COMMON_SCHEMA = {
  _pendingWrites: DEFAULT_STORE_SCHEMA,
  _appMeta: '_key',
  budgetTool: '_key',
  'budgetTool/_all/cards': '_key',
  climateTool: DEFAULT_STORE_SCHEMA,
  forms: DEFAULT_STORE_SCHEMA,
  stationData: DEFAULT_STORE_SCHEMA
};
const DB_GROUP_SCHEMA = {
  'budgetTool/${GROUP}/budgets': DEFAULT_STORE_SCHEMA,
  'users/${GROUP}/users': DEFAULT_STORE_SCHEMA
};

// replace group variable with group code from environment and export collated endpoint schema
export const DB_SCHEMA = {
  ...DB_COMMON_SCHEMA,
  ...keyReplace(DB_GROUP_SCHEMA, '${GROUP}', ENVIRONMENT.group.code)
};

export type IDBEndpoint = keyof typeof DB_SCHEMA | keyof typeof DB_GROUP_SCHEMA;

type ISOString = string;

export interface IDBDoc {
  _key: string;
  _created: ISOString;
  _modified: ISOString;
  [key: string]: any;
}

// data stored on _appMeta store
export interface IAppMeta {
  _key: 'VERSION' | 'USER_ID';
  value: string;
}

export function keyReplace(
  obj: { [key: string]: string },
  searchVal: string,
  replaceVal: string
) {
  const rep = {};
  Object.keys(obj).forEach(
    k => (rep[k.replace(searchVal, replaceVal)] = obj[k])
  );
  return rep;
}

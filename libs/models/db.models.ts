// note, as most db writes are within nested collections hard to assert strong typings without
// also lots of nested methods (e.g. setSubDoc, getSubCollectionEtc)
// type below is mostly for reference
export type IDBEndpoint =
  | 'budgetTool'
  | 'budgetTool/meta/inputs'
  | 'budgetTool/meta/outputs'
  | 'budgetTool/meta/familyLabour'
  | 'budgetTool/meta/enterpriseTypes'
  | 'budgetTool/meta/enterprises'
  | 'climateTool'
  | 'stationData';

import { firestore } from 'firebase/app';

export interface ITimestamp extends firestore.Timestamp {}
export interface IDBDoc {
  _key: string;
  _created: ITimestamp;
  _modified: ITimestamp;
}

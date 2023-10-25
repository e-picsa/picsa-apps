import { RxCollectionCreator } from 'rxdb';

/** When creating collections for PICSA db additional fields required to determine how to handle */
export interface IPicsaCollectionCreator<T> extends RxCollectionCreator<T> {
  /** User collections will append app user id to all entries */
  isUserCollection: boolean;
  /** Push a copy of all data to server db */
  syncPush?: boolean;
}

import { IDBDoc } from '@picsa/models/db.models';
import { firestore } from 'firebase/app';

export const DBTimestamp = (date?: Date) => {
  return firestore.Timestamp.fromDate(date ? date : new Date());
};
export const DBMeta = (key?: string, date?: Date): IDBDoc => {
  return {
    _key: key ? key : _generateKey(),
    _created: DBTimestamp(date),
    _modified: DBTimestamp(date)
  };
};

const _generateKey = () => {
  const key = firestore()
    .collection('_')
    .doc().id;
  console.log('key', key);
  return key;
};

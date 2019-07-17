import { firestore } from 'firebase/app';

export interface ITimestamp extends firestore.Timestamp {}
export interface IDBDoc {
  _key: string;
  _created: firestore.Timestamp;
  _modified: firestore.Timestamp;
}

export type regions = 'Malawi' | 'Kenya';

export interface IEnvironment {
  production: boolean;
  usesCordova: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

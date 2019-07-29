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

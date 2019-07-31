import { IEnvironment } from '@picsa/models';

const ENVIRONMENT: IEnvironment = {
  // During production builds this file replaces default environment to indicate we have a production build
  // Note, the keys are not committed within the default repo
  production: true,
  usesCordova: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  }
};

export default ENVIRONMENT;

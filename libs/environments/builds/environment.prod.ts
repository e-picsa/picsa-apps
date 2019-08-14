import { IEnvironment } from '@picsa/models';
import BASE_ENV from '@picsa/environments/environment.base';

const ENVIRONMENT_PROD: IEnvironment = {
  // During production builds this file replaces default environment to indicate we have a production build
  // Note, the keys are not committed within the default repo
  ...BASE_ENV,
  production: true,
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
if (ENVIRONMENT_PROD.firebase.apiKey === '') {
  throw new Error('Production Firebase Environment Not Set');
}
export default ENVIRONMENT_PROD;

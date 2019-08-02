import { sharedEnvironment as env } from './base';
import { IEnvironment } from '@picsa/models';

const ENVIRONMENT: IEnvironment = {
  // During build on mobile want to inform environment that cordova is in use so that service worker not loaded
  // and native platform apis used
  production: true,
  usesCordova: true,
  firebase: env.firebaseConfig
};

export default ENVIRONMENT;

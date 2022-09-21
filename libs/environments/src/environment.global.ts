import type { IEnvironment } from '@picsa/models';
import GROUPS from './groups';
import FIREBASE_CONFIG from './firebase/config';

/** Used in main picsa extension app, allows country-change at runtime */
const GLOBAL_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG,
  group: GROUPS.GLOBAL,
  enableProduction: true,
  defaultConfiguration: 'global',
};

export default GLOBAL_ENVIRONMENT;

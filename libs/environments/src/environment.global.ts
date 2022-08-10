import type { IEnvironment } from '@picsa/models';
import GROUPS from './groups';
import REGIONS from './regions';
import FIREBASE_CONFIG from './firebase/config';

/** Used in main picsa extension app, allows country-change at runtime */
const GLOBAL_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG,
  group: GROUPS.GLOBAL,
  region: REGIONS.GLOBAL,
  enableProduction: true,
};

export default GLOBAL_ENVIRONMENT;

import type { IEnvironment } from '@picsa/models';
import GROUPS from './groups';
import REGIONS from './regions';
import FIREBASE_CONFIG from './firebase/config';

const DEFAULT_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG,
  group: GROUPS.MALAWI,
  region: REGIONS.MALAWI,
  enableProduction: true,
  defaultConfiguration: 'malawi',
};

export default DEFAULT_ENVIRONMENT;

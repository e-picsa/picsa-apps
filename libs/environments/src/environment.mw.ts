import type { IEnvironment } from '@picsa/models';
import GROUPS from './groups';
import FIREBASE_CONFIG from './firebase/config';

const DEFAULT_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG,
  group: GROUPS.MALAWI,
  enableProduction: true,
  defaultConfiguration: 'malawi',
};

export default DEFAULT_ENVIRONMENT;

import { IEnvironment } from '../models';
import GROUPS from '@picsa/environments/groups';
import REGIONS from '@picsa/environments/regions';
import FIREBASE_CONFIG from './firebase/config';

const DEFAULT_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG,
  group: GROUPS.DEV,
  region: REGIONS.DEV,
  enableProduction: true
};

export default DEFAULT_ENVIRONMENT;

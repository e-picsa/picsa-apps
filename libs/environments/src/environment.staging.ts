import { IEnvironment } from '../models';
import GROUPS from './groups';
import REGIONS from './regions';
import FIREBASE_CONFIG from './firebase/config';

const DEFAULT_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG,
  group: GROUPS.DEV,
  region: REGIONS.DEV,
  enableProduction: true,
};

export default DEFAULT_ENVIRONMENT;

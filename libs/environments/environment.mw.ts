import { IEnvironment } from '../models';
import GROUPS from '@picsa/environments/groups';
import REGIONS from '@picsa/environments/regions';
import FIREBASE_CONFIG from './firebase';

const DEFAULT_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG.PROD,
  group: GROUPS.MALAWI,
  region: REGIONS.MALAWI,
  enableProduction: true
};

export default DEFAULT_ENVIRONMENT;

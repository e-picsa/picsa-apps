import PROD_ENV from './environment.prod';
import GROUPS from '../groups';
import REGIONS from '../regions';
import { IEnvironment } from '@picsa/models';

const ENVIRONMENT_KE: IEnvironment = {
  ...PROD_ENV,
  group: GROUPS.KENYA,
  region: REGIONS.KENYA
};

export default ENVIRONMENT_KE;

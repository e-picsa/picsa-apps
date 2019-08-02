import PROD_ENV from './environment.prod';
import GROUPS from '../groups';
import REGIONS from '../regions';
import { IEnvironment } from '@picsa/models';

const ENVIRONMENT: IEnvironment = {
  ...PROD_ENV,
  group: GROUPS.KENYA,
  region: REGIONS.KENYA
};

export default ENVIRONMENT;

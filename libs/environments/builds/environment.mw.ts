import PROD_ENV from './environment.prod';
import GROUPS from '../groups';
import REGIONS from '../regions';
import { IEnvironment } from '@picsa/models';

const ENVIRONMENT_MW: IEnvironment = {
  ...PROD_ENV,
  group: GROUPS.MALAWI,
  region: REGIONS.MALAWI
};

export default ENVIRONMENT_MW;

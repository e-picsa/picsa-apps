import PROD_ENV from '@picsa/environments/builds/environment.prod';
import GROUPS from '@picsa/environments/groups';
import REGIONS from '@picsa/environments/regions';
import { IEnvironment } from '@picsa/models';

const ENVIRONMENT_MW: IEnvironment = {
  ...PROD_ENV,
  group: GROUPS.MALAWI,
  region: REGIONS.MALAWI
};

export default ENVIRONMENT_MW;

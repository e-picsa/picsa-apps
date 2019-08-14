import PROD_ENV from '@picsa/environments/builds/environment.prod';
import GROUPS from '@picsa/environments/groups';
import REGIONS from '@picsa/environments/regions';
import { IEnvironment } from '@picsa/models';

const ENVIRONMENT_KE: IEnvironment = {
  ...PROD_ENV,
  group: GROUPS.KENYA,
  region: REGIONS.KENYA
};

export default ENVIRONMENT_KE;

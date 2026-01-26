import type { IEnvironment } from '@picsa/models';

import PRODUCTION_ENVIRONMENT from './environment.prod';

/**
 * Environments specify different build-time settings
 **/
const ENVIRONMENT: IEnvironment = {
  ...PRODUCTION_ENVIRONMENT,
  production: false,
  useMockServices: false,
};

export default ENVIRONMENT;

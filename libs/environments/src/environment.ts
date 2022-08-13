import type { IEnvironment } from '@picsa/models';
import GLOBAL_ENVIRONMENT from './environment.global';

/**
 * Environments specify different build-time settings
 **/
const ENVIRONMENT: IEnvironment = {
  ...GLOBAL_ENVIRONMENT,
  enableProduction: false,
};

export default ENVIRONMENT;

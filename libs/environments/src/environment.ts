import type { IEnvironment } from '@picsa/models';
import GLOBAL_ENVIRONMENT from './environment.global';

/** Used in main picsa extension app, allows country-change at runtime */
const ENVIRONMENT: IEnvironment = {
  ...GLOBAL_ENVIRONMENT,
  enableProduction: false,
};

export default ENVIRONMENT;

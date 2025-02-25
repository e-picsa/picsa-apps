// tslint:disable no-var-requires
import packageJson from '../../../package.json';

export const APP_VERSION = {
  /** Semver code for current app version, e.g. 3.26.0 (TODO - rename) */
  number: packageJson.version,
  date: '2025-02-15',
};

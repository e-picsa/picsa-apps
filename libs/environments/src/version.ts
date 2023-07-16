// tslint:disable no-var-requires
import packageJson from '../../../package.json';
// e.g. 1.0.1 - even though called a number is stored as a string

export const APP_VERSION = {
  number: packageJson.version,
  date: '2023-07-16',
};

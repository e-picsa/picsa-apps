// tslint:disable no-var-requires
declare var require: any;
// e.g. 1.0.1 - even though called a number is stored as a string
const VERSION_NUMBER = require('../../package.json').version as string;

export const APP_VERSION = {
  number: VERSION_NUMBER,
  date: '2019-08-04'
};

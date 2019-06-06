// tslint:disable no-var-requires
declare var require: any;
export const VERSION = require("../../package.json").version;

export const APP_VERSION = {
  text: VERSION,
  date: ""
};

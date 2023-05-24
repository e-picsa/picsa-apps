import Parse from 'parse/node';

import * as generatedSchema from '../../generated/schema';
import { PATHS } from '../paths';
import { populateEnv } from './cli.utils';

/** Return configured Parse server namespace */
export function initializeParseServer() {
  // When running in docker environment env vars should be populated
  // When calling scripts direct locally it will not
  if (!process.env.PARSE_SERVER_APPLICATION_ID) {
    const { envFilePath } = PATHS;
    populateEnv(envFilePath);
  }
  const { PARSE_SERVER_APPLICATION_ID, PARSE_SERVER_MASTER_KEY } = process.env;
  Parse.initialize(PARSE_SERVER_APPLICATION_ID as string, undefined, PARSE_SERVER_MASTER_KEY as string);
  Parse.serverURL = 'http://localhost:1337/parse';
}

/**
 * Call registration methods to register custom subclasses
 * This will instantiate results of queries with the class methods
 *
 * This can only be done after parse has been initialised, and hence why
 * not inlined into imports as in many examples
 *
 * https://community.parseplatform.org/t/registersubclass-doesnt-work/2578/5
 * */
export function registerParseSubclasses() {
  for (const subclass of Object.values(generatedSchema)) {
    if (subclass.hasOwnProperty('unregister')) {
      subclass.unregister();
    }
    if (subclass.hasOwnProperty('register')) {
      subclass.register();
    }
  }
}

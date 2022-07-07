import Parse from 'parse/node';
import * as schema from '../../generatedSchema';
import { populateEnv } from './env.utils';

/** Return configured Parse server namespace */
export function initializeParseServer() {
  populateEnv();
  const { PARSE_SERVER_APPLICATION_ID, PARSE_SERVER_MASTER_KEY, PORT } =
    process.env;

  Parse.initialize(
    PARSE_SERVER_APPLICATION_ID as string,
    undefined,
    PARSE_SERVER_MASTER_KEY as string
  );
  Parse.serverURL = `http://localhost:${PORT || 1337}/parse`;
  registerSubclasses();
  return Parse;
}

/** Call registration methods to register custom subclasses */
function registerSubclasses() {
  for (const [name, method] of Object.entries(schema)) {
    if (name.startsWith('register')) {
      const register: () => void = method as any;
      register();
    }
  }
}

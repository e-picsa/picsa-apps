import Parse from 'parse/node';
import { PATHS } from '../paths';
import dotenv from 'dotenv';
dotenv.config({ path: PATHS.envFilePath });

/** Return configured Parse server namespace */
export function getParseServer() {
  const { PARSE_SERVER_APPLICATION_ID, PARSE_SERVER_MASTER_KEY } = process.env;
  Parse.initialize(
    PARSE_SERVER_APPLICATION_ID as string,
    undefined,
    PARSE_SERVER_MASTER_KEY as string
  );
  Parse.serverURL = 'http://localhost:1337/parse';
  return Parse;
}

import { sharedEnvironment as env } from "./base";
import { IEnvironment } from "src/models/models";

const ENVIRONMENT: IEnvironment = {
  // During production builds this file replaces default environment to indicate we have a production build
  production: true,
  usesCordova: false,
  firebase: {
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain,
    databaseURL: env.firebaseDatabaseUrl,
    projectId: env.firebaseProjectId,
    storageBucket: env.firebaseStorageBucket,
    messagingSenderId: env.firebaseMessagingSenderId,
    appId: env.firebaseAppId
  }
};

export default ENVIRONMENT;

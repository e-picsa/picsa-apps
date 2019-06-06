import { sharedEnvironment as env } from "./base";
import { IEnvironment } from "src/models/models";

const ENVIRONMENT: IEnvironment = {
  // During build on mobile want to inform environment that cordova is in use so that service worker not loaded
  // and native platform apis used
  production: true,
  usesCordova: true,
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

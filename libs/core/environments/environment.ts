// There are 3 different environments to consider: localhost, staging and production
// There are 2 different project databases: staging (for localhost/staging) and production (for production)

// sharedEnvironment passes process.env variables from the build pipeline, used to provide
// the production database for production deployments and staging database for all others
import { sharedEnvironment as env } from "./base";
import { IEnvironment } from "src/models/models";

const ENVIRONMENT: IEnvironment = {
  // For localhost set production to false to prevent service-worker registration and sentry error logs
  production: false,
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

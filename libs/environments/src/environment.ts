import { IEnvironment } from '@picsa/models';
import GROUPS from './groups';
import REGIONS from './regions';
import FIREBASE_CONFIG from './firebase/config';

const DEFAULT_ENVIRONMENT: IEnvironment = {
  firebase: FIREBASE_CONFIG,
  group: GROUPS.DEV,
  region: REGIONS.DEV,
  enableProduction: false,
};

export default DEFAULT_ENVIRONMENT;

// There are 3 different environments to consider: localhost, staging and production
// There are 2 different project databases: staging (for localhost/staging) and production (for production)

// sharedEnvironment passes process.env variables from the build pipeline, used to provide
// the production database for production deployments and staging database for all others

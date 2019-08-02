// There are 3 different environments to consider: localhost, staging and production
// There are 2 different project databases: staging (for localhost/staging) and production (for production)

// sharedEnvironment passes process.env variables from the build pipeline, used to provide
// the production database for production deployments and staging database for all others
import BASE_ENV from './environment.base';
import { IEnvironment } from '../models';

const DEFAULT_ENVIRONMENT: IEnvironment = {
  ...BASE_ENV
};

export default DEFAULT_ENVIRONMENT;

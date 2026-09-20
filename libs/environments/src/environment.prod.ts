import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';
import { SentryConfig } from './sentry/config';

/** Used in main picsa app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  sentry: SentryConfig,
  group: GROUPS.GLOBAL,
  production: true,
};

export default productionEnvironment;

import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';

/** Used in main picsa app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
};

export default productionEnvironment;

import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';

/** Used in main picsa extension app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
  defaultConfiguration: 'global',
};

export default productionEnvironment;

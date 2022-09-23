import type { IEnvironment } from '@picsa/models';
import GROUPS from './groups';
import { FirebaseConfig } from './firebase/config';

/** Used in main picsa extension app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
  defaultConfiguration: 'global',
};

export default productionEnvironment;

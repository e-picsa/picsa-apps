import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';

/** Used in e2e testing environments */
const e2eEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: false,
  useMockServices: true, // <--- main change to allow selective service replacements in app.module.ts
};

export default e2eEnvironment;

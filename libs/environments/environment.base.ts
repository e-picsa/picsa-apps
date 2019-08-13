import { IEnvironment } from '@picsa/models';
import GROUPS from '@picsa/environments/groups';
import REGIONS from '@picsa/environments/regions';

// As angular can't pick up process.env variables ng-node-environment is used to repopulate during CI
// (see https://github.com/angular/angular-cli/issues/4318)

// note, the key below is intentionally exposed and simply provides limited access to the staging/development site resources
const BASE_ENV: IEnvironment = {
  firebase: {
    apiKey: 'AIzaSyCHzsaVc4TuG3QMFjI_SKP1Px-E5QRglcM',
    authDomain: 'extension-toolkit.firebaseapp.com',
    databaseURL: 'https://extension-toolkit.firebaseio.com',
    projectId: 'extension-toolkit',
    storageBucket: 'extension-toolkit.appspot.com',
    messagingSenderId: '249750594240',
    appId: '1:249750594240:web:85afd34173faddcc'
  },
  group: GROUPS.DEV,
  production: false,
  region: REGIONS.DEV,
  usesCordova: false
};
export default BASE_ENV;

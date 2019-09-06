import { IFirebaseSettings } from '@picsa/models';

/***********************************************************************************
 *  Write firebase prod config from environment (either .env or travis env)
 *
 **********************************************************************************/
const fs = require('fs');
require('dotenv').config();
const e = process.env;
const firebaseConfig: IFirebaseSettings = {
  apiKey: e.FIREBASE_PROD_API_KEY,
  appId: e.FIREBASE_PROD_APP_ID,
  authDomain: e.FIREBASE_PROD_AUTH_DOMAIN,
  databaseURL: e.FIREBASE_PROD_DATABASE_URL,
  messagingSenderId: e.FIREBASE_PROD_MESSAGING_SENDER_ID,
  projectId: e.FIREBASE_PROD_API_PROJECT_ID,
  storageBucket: e.FIREBASE_PROD_STORAGE_BUCKET
};

console.log('firebase config', firebaseConfig);

// if (environment === 'production') {
//   apiURL = process.env.PRODUCTION_API_ENDPOINT;
// } else if (environment === 'test') {
//   apiURL = process.env.TEST_API_ENDPOINT;
// }
const targetPath = `./libs/environments/firebase/config.prod.ts`;
const envConfigFile = `export default ${JSON.stringify(firebaseConfig)}`;
fs.writeFile(targetPath, envConfigFile, function(err) {
  if (err) {
    console.log(err);
  }
});

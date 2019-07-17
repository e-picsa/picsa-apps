// As angular can't pick up process.env variables ng-node-environment is used to repopulate during CI
// (see https://github.com/angular/angular-cli/issues/4318)

// note, the key below is intentionally exposed and simply provides limited access to the staging/development site resources
export const sharedEnvironment: ISharedEnv = {
  firebaseApiKey: "AIzaSyCjVzdn5WTQKSDqGw9F0nNbhtdCDcPYP3I",
  firebaseAuthDomain: "extension-toolkit-staging.firebaseapp.com",
  firebaseDatabaseUrl: "https://extension-toolkit-staging.firebaseio.com",
  firebaseProjectId: "extension-toolkit-staging",
  firebaseStorageBucket: "extension-toolkit-staging.appspot.com",
  firebaseMessagingSenderId: "621985864882",
  firebaseAppId: "1:621985864882:web:a19ebe2425f632b6"
};
interface ISharedEnv {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseDatabaseUrl: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
}

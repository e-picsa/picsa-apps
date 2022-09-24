import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.picsa.extension',
  appName: 'PICSA Extension',
  webDir: '../../../dist/apps/picsa-apps/extension-app',
  bundledWebRuntime: false,
  // manually include plugins here as top-level package.json not checked correctly
  // note - see which plugins are detected via `npx cap ls`
  includePlugins: [
    // ionic native (migrated)
    '@awesome-cordova-plugins/file-opener',
    'cordova-plugin-file-opener2',
    '@awesome-cordova-plugins/file',
    'cordova-plugin-file',
    '@awesome-cordova-plugins/network',
    'cordova-plugin-network',
    '@awesome-cordova-plugins/social-sharing',
    'cordova-plugin-x-socialsharing',
    // cordova standalone
    'cordova-plugin-codeplay-share-own-apk',
    // capacitor
    '@capacitor/app',
    '@capacitor/browser',
    '@capacitor/filesystem',
    'capacitor-blob-writer',
    '@capacitor-community/firebase-analytics',
    '@capacitor-community/firebase-crashlytics',
  ],
  /**
   * uncomment and replace with local ip to serve live-reload
   * TODO - could create script to automatially toggle when serving native
   **/
  // server: {
  //   url: 'http://192.168.0.54:4200',
  //   cleartext: true,
  // },
};

export default config;

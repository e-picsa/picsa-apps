import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.picsa.extension_toolkit',
  appName: 'PICSA Extension Toolkit',
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
    '@awesome-cordova-plugins/file-transfer',
    'cordova-plugin-file-transfer',
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
  ],
  /** uncomment and replace with local ip to serve live-reload  */
  // server: {
  //   url: 'http://192.168.0.1:4200',
  //   cleartext: true,
  // },
};

export default config;

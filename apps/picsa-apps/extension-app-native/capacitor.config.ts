import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.picsa.extension_toolkit',
  appName: 'PICSA Extension Toolkit',
  webDir: '../../../dist/apps/picsa-apps/extension-app',
  bundledWebRuntime: false,
  // manually include plugins here as top-level package.json not checked correctly
  // note - see which plugins are detected via `npx cap ls`
  includePlugins: [
    '@awesome-cordova-plugins/file-opener',
    'cordova-plugin-file-opener2',
    '@capacitor/app',
    '@capacitor/browser',
    '@capacitor/filesystem',
    '@ionic-native/file',
    '@ionic-native/file-transfer',
    '@ionic-native/network',
    '@ionic-native/social-sharing',
    'cordova-plugin-codeplay-share-own-apk',
  ],
  /** uncomment and replace with local ip to serve live-reload  */
  // server: {
  //   url: 'http://192.168.0.1:4200',
  //   cleartext: true,
  // },
};

export default config;

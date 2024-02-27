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
    '@awesome-cordova-plugins/social-sharing',
    'cordova-plugin-x-socialsharing',
    // cordova standalone
    'cordova-plugin-codeplay-share-own-apk',
    // capacitor
    '@capacitor/app',
    '@capacitor/browser',
    '@capacitor/core',
    '@capacitor/device',
    '@capacitor/filesystem',
    '@capacitor/network',
    'capacitor-blob-writer',
    'capacitor-video-player',
    '@capacitor-community/firebase-analytics',
    '@capacitor-community/firebase-crashlytics',
    '@capacitor-firebase/performance',
    '@capacitor/screen-orientation',
  ],
  // Enable app to use native http for requests (bypass cors)
  // https://capacitorjs.com/docs/apis/http
  // TODO - check if resources still work as intended once enabled
  // plugins: {
  //   CapacitorHttp: {
  //     enabled: true,
  //   },
  // },
  server: {
    androidScheme: 'http',

    /**
     * NOTE - cleartext still required for caching fetch requests even when not serving locally
     * https://stackoverflow.com/questions/60906953/ionic-5-capacitor-err-cleartext-not-permitted-in-android
     */
    cleartext: true,
  },
};

/**
 * Additional configuration used to support live-reloading the app from a dev server
 * See https://docs.picsa.app/advanced/testing
 **/
if (process.env.SERVER_URL) {
  config.server = { ...config.server, url: process.env.SERVER_URL };
}

export default config;

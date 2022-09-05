import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.picsa.extension_toolkit',
  appName: 'PICSA Extension Toolkit',
  webDir: '../../../dist/apps/picsa-apps/extension-app',
  bundledWebRuntime: false,
  // manually include plugins here as top-level package.json not checked correctly
  includePlugins: ['@capacitor/browser', '@capacitor/filesystem'],
};

export default config;

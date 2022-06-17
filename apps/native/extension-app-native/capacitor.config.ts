import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.picsa.extension_toolkit',
  appName: 'PICSA Extension Toolkit',
  webDir: '../../../dist/apps/native/extension-app',
  bundledWebRuntime: false,
};

export default config;

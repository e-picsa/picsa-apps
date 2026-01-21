import { browser } from '@wdio/globals';
import type { Options } from '@wdio/types';
import path from 'path';

export const config: Options.Testrunner = {
  //
  // ====================
  // Runner Configuration
  // ====================
  //
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      transpileOnly: true,
      project: path.join(__dirname, 'tsconfig.json'),
    },
  },
  //
  // ==================
  // Specify Test Files
  // ==================
  //
  specs: ['./src/specs/**/*.ts'],
  //
  // ============
  // Capabilities
  // ============
  //
  capabilities: [
    {
      // capabilities for local Appium on the Android emulator
      platformName: 'Android',
      'appium:deviceName': 'Android Emulator',
      'appium:automationName': 'UiAutomator2',
      'appium:app': path.join(__dirname, '../app-native/android/app/build/outputs/apk/debug/app-debug.apk'),
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240,
    },
  ],
  //
  // ===================
  // Test Configurations
  // ===================
  //
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: [
    [
      'appium',
      {
        command: 'appium',
        args: {
          address: '127.0.0.1',
          port: 4723,
          relaxedSecurity: true,
        },
        logPath: './',
      },
    ],
  ],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
  before: async function () {
    const { switchToWebView, loadState } = await import('./src/utils/wdio-commands');

    // Add custom command to switch to WebView
    browser.addCommand('switchToWebView', switchToWebView);

    // Add custom command to load state
    browser.addCommand('loadState', loadState);
  },
};

import { browser } from '@wdio/globals';
import type { Options } from '@wdio/types';
import { existsSync, mkdirSync, statSync } from 'fs';
import { emptyDirSync } from 'fs-extra';
import path from 'path';

import { PATHS } from './src/constants';

const isCI = !!process.env.CI;

// Use APK_PATH env var (CI) or local build path (local dev)
const apkPath = process.env.APK_PATH
  ? path.join(process.env.APK_PATH, 'app-debug.apk')
  : path.join(__dirname, '../app-native/android/app/build/outputs/apk/debug/app-debug.apk');

export const config: Options.Testrunner = {
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      transpileOnly: true,
      project: path.join(__dirname, 'tsconfig.json'),
    },
  },
  specs: ['./src/specs/**/*.ts'],
  capabilities: [
    {
      platformName: 'Android',
      'appium:deviceName': isCI ? 'emulator-5554' : 'Android Emulator',
      'appium:automationName': 'UiAutomator2',
      'appium:app': apkPath,
      'appium:autoGrantPermissions': true,
      'appium:enforceAppInstall': true,
      'appium:newCommandTimeout': 240,
      // Longer AVD launch timeout for CI
      'appium:avdLaunchTimeout': isCI ? 180000 : 60000,
      'appium:avdReadyTimeout': isCI ? 180000 : 60000,
    },
  ],
  onPrepare: function () {
    if (existsSync(apkPath)) {
      const { mtime } = statSync(apkPath);
      console.log(`\n\n🔹 Using APK: ${apkPath}`);
      console.log(`🔹 APK Last Modified: ${mtime}\n\n`);
    }
  },
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: isCI ? 30000 : 10000,
  connectionRetryTimeout: isCI ? 180000 : 120000,
  connectionRetryCount: 5,
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
    timeout: isCI ? 300000 : 60000,
  },
  before: async function () {
    const { switchToWebView, appNavigateTo } = await import('./src/utils/wdio-commands');
    browser.addCommand('switchToWebView', switchToWebView);
    browser.addCommand('appNavigateTo', appNavigateTo);
    const { loadPicsaConfig } = await import('./src/utils/picsa-utils');
    browser.addCommand('loadPicsaConfig', loadPicsaConfig);
    setupScreenshotsFolder();
  },
};

function setupScreenshotsFolder() {
  const screenshotPath = PATHS.SCREENSHOTS;
  if (!existsSync(screenshotPath)) {
    mkdirSync(screenshotPath, { recursive: true });
  }
  emptyDirSync(screenshotPath);
}

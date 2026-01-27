import { browser } from '@wdio/globals';

/**
 * Min android version as mapped from `minSdkVersion` (API 23, Android 6.0)
 * Logic taken from `apps/picsa-apps/app/src/assets/compatibility.js`
 */
const MIN_ANDROID_VERSION = 6.0;

/**
 * Minimum version of chrome required to run app
 * Logic taken from `apps/picsa-apps/app/src/assets/compatibility.js`
 */
const MIN_ANDROID_WEBVIEW_VERSION = 93;

interface DeviceInfo {
  operatingSystem?: string;
  osVersion?: string;
  androidVersion?: number;
  chromeVersion?: number;
  [key: string]: unknown;
}

/**
 * Get device info from the browser context
 */
export async function getDeviceStatus(): Promise<DeviceInfo> {
  return browser.execute(() => {
    // Replicating `getChromeVersion` from compatibility.js
    function getChromeVersion() {
      const ua = navigator.userAgent.toLowerCase();
      const regex = /chrome\/([0-9]*)\./;
      const res = regex.exec(ua);
      if (res) {
        return parseInt(res[1]);
      }
      return undefined;
    }

    const uaFields: DeviceInfo = {};
    const ua = navigator.userAgent;
    const start = ua.indexOf('(') + 1;
    const end = ua.indexOf(') AppleWebKit');
    const fields = ua.substring(start, end);

    if (ua.indexOf('Android') !== -1) {
      const tmpFields = fields.replace('; wv', '').split('; ').pop();
      if (tmpFields) {
        // Model extraction might be slightly different depending on device but this covers the basics
      }
      uaFields.osVersion = fields.split('; ')[1];
    }

    if (/android/i.test(ua)) {
      uaFields.operatingSystem = 'android';
    }

    if (uaFields.operatingSystem === 'android' && uaFields.osVersion) {
      uaFields.androidVersion = parseFloat(uaFields.osVersion.toLowerCase().replace('android', '').trim());
      uaFields.chromeVersion = getChromeVersion();
    }

    return uaFields;
  });
}

let isLegacyCache: boolean | undefined;

/**
 * Check if the device is restricted (meaning it SHOULD show the prompt)
 */
export async function isLegacyDevice(): Promise<boolean> {
  if (isLegacyCache !== undefined) {
    return isLegacyCache;
  }

  const info = await getDeviceStatus();
  if (info.operatingSystem !== 'android') {
    isLegacyCache = false;
    return false;
  }

  if (info.androidVersion && info.androidVersion < MIN_ANDROID_VERSION) {
    isLegacyCache = true;
    return true;
  }

  if (info.chromeVersion && info.chromeVersion < MIN_ANDROID_WEBVIEW_VERSION) {
    isLegacyCache = true;
    return true;
  }

  isLegacyCache = false;
  return false;
}

/**
 * Mocha helper to skip tests on restricted devices
 * Use this for functional tests that should NOT run on old devices
 */
export async function skipOnRestrictedDevice(context: Mocha.Context) {
  const restricted = await isLegacyDevice();
  if (restricted) {
    console.log('Skipping test on restricted device');
    context.skip();
  }
}

/**
 * Mocha helper to skip tests on supported devices
 * Use this for the compatibility prompt test which should ONLY run on old devices
 */
export async function skipOnSupportedDevice(context: Mocha.Context) {
  const restricted = await isLegacyDevice();
  if (!restricted) {
    console.log('Skipping compatibility test on supported device');
    context.skip();
  }
}

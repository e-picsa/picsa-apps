import { resolve } from 'path';

const rootDir = resolve(__dirname, '../../../');
const appsDir = resolve(rootDir, 'apps');

const extensionAppNative = resolve(appsDir, 'picsa-apps/extension-app-native');

export const PATHS = { rootDir, extensionAppNative };

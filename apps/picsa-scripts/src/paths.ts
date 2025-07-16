import { resolve } from 'path';

const rootDir = resolve(__dirname, '../../../');
const appsDir = resolve(rootDir, 'apps');

const extensionAppNative = resolve(appsDir, 'picsa-apps/app-native');

export const PATHS = { rootDir, extensionAppNative };

import { resolve } from 'path';

export const STORAGE_KEYS = {
  USER_SETTINGS: 'picsa_user_settings',
};

export const TIMEOUTS = {
  WEBVIEW_WAIT: 30000,
  RELOAD_WAIT: 2000,
};

const projectDir = resolve(__dirname, '../');

export const PATHS = {
  FIXTURES: resolve(projectDir, 'src/fixtures'),
  SCREENSHOTS: resolve(projectDir, 'screenshots'),
};

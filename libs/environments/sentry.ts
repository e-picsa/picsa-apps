import { APP_VERSION } from './version';
// used to configure sentry and link to sentry releases
export const SENTRY_CONFIG = {
  dsn: 'https://a41c543933224f8695b6dcdae0edf9a5@sentry.io/1765914',
  release: `picsa-app@${APP_VERSION.number}`
};

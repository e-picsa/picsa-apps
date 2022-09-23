import { APP_VERSION } from './version';
// used to configure sentry and link to sentry releases
export const SENTRY_CONFIG = {
  dsn: 'https://79ac03b265304bf3a8f50ec8fd34b59a@o1420740.ingest.sentry.io/6765888',
  release: `picsa-app@${APP_VERSION.number}`,
};

import { isDevEnvironment, useProdClimateApi } from '../../_shared/env.ts';
import { forecastDB as forecastDBProd } from './forecast-db.ts';
import { forecastStorage as forecastStorageProd } from './forecast-storage.ts';
import { forecastDBMock, forecastStorageMock } from './index.mock.ts';

/**
 * Dispatch forecastDB requests to mock handler in development,
 * or production handler if running in production or USE_PROD_CLIMATE_API=true.
 */
export const forecastDB = async (req: Request) => {
  if (isDevEnvironment() && !useProdClimateApi()) {
    console.log('[Forecasts] Routing forecastDB to local mock handler');
    return forecastDBMock(req);
  }
  return forecastDBProd(req);
};

/**
 * Dispatch forecastStorage requests to mock handler in development,
 * or production handler if running in production or USE_PROD_CLIMATE_API=true.
 */
export const forecastStorage = async (req: Request) => {
  if (isDevEnvironment() && !useProdClimateApi()) {
    console.log('[Forecasts] Routing forecastStorage to local mock handler');
    return forecastStorageMock(req);
  }
  return forecastStorageProd(req);
};

export { forecastCleanup } from './forecast-cleanup.ts';
export { forecastFileMock } from './index.mock.ts';

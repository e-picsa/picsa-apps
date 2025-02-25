import mw from './mw';
import zm from './zm';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';

export type IClimateForecastRow = Database['public']['Tables']['climate_forecasts']['Row'];

export const CLIMATE_FORECASTS_DB = [...zm.downscaled, ...zm.seasonal, ...mw.downscaled, ...mw.seasonal];

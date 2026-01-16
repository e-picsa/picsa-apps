import mw from './mw';
import zm from './zm';

import { Database } from '@picsa/server-types';

export type IForecastRow = Database['public']['Tables']['forecasts']['Row'];

export const FORECASTS_DB = [...zm.downscaled, ...zm.seasonal, ...mw.downscaled, ...mw.seasonal];

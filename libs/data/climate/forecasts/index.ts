import type { Database } from '@picsa/server-types';

import mw from './mw.json';
import zm from './zm.json';
import zw from './zw.json';

export type IForecastRow = Database['public']['Tables']['forecasts']['Row'];

/** Bundled rows omit volatile timestamps so sync output stays deterministic across runs */
export type IForecastBundleRow = Omit<IForecastRow, 'created_at' | 'updated_at'>;

interface IForecastBundle {
  seasonal: IForecastBundleRow[];
  downscaled: IForecastBundleRow[];
}

// JSON imports are untyped at compile time; shape is enforced by sync-forecasts.ts
const bundles = [mw, zm, zw] as unknown as IForecastBundle[];

export const FORECASTS_DB: IForecastBundleRow[] = bundles.flatMap((bundle) => [
  ...bundle.downscaled,
  ...bundle.seasonal,
]);

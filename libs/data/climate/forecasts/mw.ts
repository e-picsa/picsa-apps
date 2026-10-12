import { IForecastRow } from './types';

// 2025-26 forecasts retired via tombstone migration
// (20261012000001_retire_2025_forecasts.sql). Bundled fallback intentionally
// empty: live forecasts sync from server, and stale rows must not re-seed
// offline installs. Add current-season rows here only if an offline fallback
// is explicitly required.
const seasonal: IForecastRow[] = [];

const downscaled: IForecastRow[] = [];

export default { seasonal, downscaled };

import type { IForecastRow } from '../../../types';
import { buildForecastOverview } from './forecast-overview.utils';

const row = (partial: Partial<IForecastRow>): IForecastRow =>
  ({
    country_code: 'zm',
    language_code: null,
    downscaled_location: null,
    label: null,
    mimetype: 'text/html',
    storage_file: 'zm/forecasts/daily/2026/11/01/file.html',
    created_at: '2026-11-01T08:00:00+00:00',
    updated_at: '2026-11-01T08:35:00+00:00',
    ...partial,
  }) as IForecastRow;

// Fixed reference date so month buckets are deterministic: Nov 2026
const REF = new Date('2026-11-15T12:00:00Z');

describe('buildForecastOverview', () => {
  it('counts live and pending daily/weekly rows for current and previous month', () => {
    const rows = [
      row({ id: '20261101/a.html', forecast_type: 'daily' }),
      row({ id: '20261102/b.html', forecast_type: 'daily', storage_file: null }),
      row({ id: '20261102/c.html', forecast_type: 'weekly', storage_file: null }),
      row({ id: '20261030/d.html', forecast_type: 'daily' }),
      row({ id: '20261030/e.html', forecast_type: 'weekly' }),
    ];
    const overview = buildForecastOverview(rows, REF);
    expect(overview.current.prefix).toBe('202611');
    expect(overview.current.dailyLive).toBe(1);
    expect(overview.current.dailyPending).toBe(1);
    expect(overview.current.weeklyLive).toBe(0);
    expect(overview.current.weeklyPending).toBe(1);
    expect(overview.previous.prefix).toBe('202610');
    expect(overview.previous.dailyLive).toBe(1);
    expect(overview.previous.weeklyLive).toBe(1);
  });

  it('ignores rows from other months', () => {
    const rows = [row({ id: '20260901/a.html', forecast_type: 'daily' })];
    const overview = buildForecastOverview(rows, REF);
    expect(overview.current.dailyLive).toBe(0);
    expect(overview.previous.dailyLive).toBe(0);
    expect(overview.lastSync).toBe('2026-11-01T08:35:00+00:00');
  });

  it('flags the current month as stale when nothing synced recently', () => {
    const old = row({ id: '20261101/a.html', forecast_type: 'daily', updated_at: '2026-11-01T08:35:00+00:00' });
    expect(buildForecastOverview([old], REF).current.stale).toBe(true);

    const fresh = row({ id: '20261115/a.html', forecast_type: 'daily', updated_at: new Date().toISOString() });
    expect(buildForecastOverview([fresh], REF).current.stale).toBe(false);
  });

  it('reports latest live seasonal label and downscaled location coverage', () => {
    const rows = [
      row({ id: '2026/seasonal/a.html', forecast_type: 'seasonal', label: '2024 - 2025' }),
      row({ id: '2026/seasonal/b.html', forecast_type: 'seasonal', label: '2025 - 2026' }),
      row({ id: '2026/seasonal/c.html', forecast_type: 'seasonal', label: '2026 - 2027', storage_file: null }),
      row({ id: '2026/downscaled/a.html', forecast_type: 'downscaled', downscaled_location: 'chipata' }),
      row({ id: '2026/downscaled/b.html', forecast_type: 'downscaled', downscaled_location: 'chipata' }),
      row({ id: '2026/downscaled/c.html', forecast_type: 'downscaled', downscaled_location: 'petauke' }),
      row({
        id: '2026/downscaled/d.html',
        forecast_type: 'downscaled',
        downscaled_location: 'lundazi',
        storage_file: null,
      }),
    ];
    const overview = buildForecastOverview(rows, REF);
    expect(overview.seasonalLatest).toBe('2025 - 2026');
    expect(overview.downscaledLocations).toBe(2);
  });

  it('handles empty input', () => {
    const overview = buildForecastOverview([], REF);
    expect(overview.current.dailyLive).toBe(0);
    expect(overview.current.lastSync).toBeNull();
    expect(overview.current.stale).toBe(true);
    expect(overview.seasonalLatest).toBeNull();
    expect(overview.downscaledLocations).toBe(0);
    expect(overview.lastSync).toBeNull();
  });
});

import { IForecastRow } from '../types/forecast.types';
import { SERVER_DB_MAPPING_V2 } from './schema_v2';

const BASE_ROW = {
  country_code: 'zm',
  downscaled_location: null,
  forecast_type: 'daily',
  id: '20260915/zambia-lunchtime-weather-report-tuesday-15-09-2026.html',
  label: 'ZAMBIA LUNCHTIME WEATHER REPORT: TUESDAY (15/09/2026)',
  language_code: null,
  mimetype: 'text/html',
  storage_file: 'zm/forecasts/daily/20260915/zambia-lunchtime-weather-report-tuesday-15-09-2026.html',
} as unknown as IForecastRow;

describe('SERVER_DB_MAPPING_V2', () => {
  it('maps all server fields through', () => {
    const mapped = SERVER_DB_MAPPING_V2({ ...BASE_ROW, language_code: 'en' } as IForecastRow);
    expect(mapped).toMatchObject({
      country_code: 'zm',
      forecast_type: 'daily',
      id: BASE_ROW.id,
      label: BASE_ROW.label,
      language_code: 'en',
      mimetype: 'text/html',
      storage_file: BASE_ROW.storage_file,
    });
  });

  it('strips nulls from non-nullable schema props so RxDB validation passes (COL20)', () => {
    const mapped = SERVER_DB_MAPPING_V2(BASE_ROW);
    expect(mapped).not.toHaveProperty('language_code');
    expect(mapped.storage_file).toBe(BASE_ROW.storage_file);
  });

  it('preserves nulls for nullable schema props', () => {
    const mapped = SERVER_DB_MAPPING_V2(BASE_ROW);
    expect(mapped).toHaveProperty('downscaled_location', null);
    expect(mapped).toHaveProperty('label', BASE_ROW.label);
  });
});

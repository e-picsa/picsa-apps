import { IForecastRow } from '../types/forecast.types';
import { SERVER_DB_MAPPING_V2 } from './schema_v2';

const serverRow: IForecastRow = {
  id: '2026/seasonal/zm_en',
  created_at: '2026-10-01T00:00:00+00:00',
  updated_at: '2026-10-02T00:00:00+00:00',
  forecast_type: 'seasonal',
  location: [],
  country_code: 'zm',
  language_code: 'zm_en',
  storage_file: 'zm/forecasts/seasonal/2026/zm_en.pdf',
  mimetype: 'application/pdf',
  label: '2026 - 2027',
  downscaled_location: null,
};

describe('SERVER_DB_MAPPING_V2', () => {
  it('maps the persisted fields and drops volatile metadata', () => {
    expect(SERVER_DB_MAPPING_V2(serverRow)).toEqual({
      country_code: 'zm',
      downscaled_location: null,
      forecast_type: 'seasonal',
      id: '2026/seasonal/zm_en',
      label: '2026 - 2027',
      language_code: 'zm_en',
      mimetype: 'application/pdf',
      storage_file: 'zm/forecasts/seasonal/2026/zm_en.pdf',
    });
  });

  it('accepts timestamp-less bundle rows', () => {
    const { created_at, updated_at, ...bundleRow } = serverRow;
    expect(created_at).toBeDefined();
    expect(updated_at).toBeDefined();
    expect(SERVER_DB_MAPPING_V2(bundleRow)).toEqual(SERVER_DB_MAPPING_V2(serverRow));
  });

  it('strips unknown props (e.g. legacy location) rejected by dev schema validation', () => {
    const mapped = SERVER_DB_MAPPING_V2(serverRow);
    expect(mapped).not.toHaveProperty('location');
    expect(mapped).not.toHaveProperty('created_at');
    expect(mapped).not.toHaveProperty('updated_at');
  });

  it('passes tombstone nulls through untouched (filtering happens upstream)', () => {
    const mapped = SERVER_DB_MAPPING_V2({ ...serverRow, storage_file: null });
    expect(mapped.storage_file).toBeNull();
  });
});

import { IForecast_V2, SCHEMA_V2 } from './schema_v2';
import { COLLECTION_V3, IForecast_V3, SCHEMA_V3, SERVER_DB_MAPPING_V3 } from './schema_v3';

describe('Forecast schema v3 (cache wipe release)', () => {
  it('bumps the schema version to trigger migration on upgrade', () => {
    expect(SCHEMA_V3.version).toBe(3);
  });

  it('keeps the document shape identical to v2 (wipe only, no field changes)', () => {
    const { version, ...v3Rest } = SCHEMA_V3;
    const { version: _v2Version, ...v2Rest } = SCHEMA_V2;
    expect(version).toBe(3);
    expect(v3Rest).toEqual(v2Rest);
    const legacyDoc: IForecast_V2 = {
      country_code: 'zm',
      downscaled_location: null,
      forecast_type: 'seasonal',
      id: '2026/seasonal/zm_en',
      label: '2026 - 2027',
      language_code: 'zm_en',
      mimetype: 'application/pdf',
      storage_file: 'zm/forecasts/seasonal/2026/zm_en.pdf',
    };
    // V3 accepts every v2 doc unchanged (compile-time check via assignment)
    const migratedDoc: IForecast_V3 = legacyDoc;
    expect(migratedDoc.id).toBe(legacyDoc.id);
  });

  it('drops all existing docs during migration (returns null)', async () => {
    const strategies = COLLECTION_V3.migrationStrategies as Record<number, (doc: any) => any>;
    expect(await strategies[3]({ id: '2025/seasonal/mw_en' })).toBeNull();
    expect(await strategies[3]({ id: 'stub/daily/zm' })).toBeNull();
    expect(await strategies[3]({ id: '2026/seasonal/zm_en' })).toBeNull();
  });

  it('preserves earlier migration strategies for users skipping versions', () => {
    const strategies = COLLECTION_V3.migrationStrategies as Record<number, unknown>;
    expect(strategies[1]).toBeDefined();
    expect(strategies[2]).toBeDefined();
    expect(strategies[3]).toBeDefined();
  });

  it('re-exports the v2 server mapping unchanged', () => {
    expect(SERVER_DB_MAPPING_V3).toBeDefined();
  });
});

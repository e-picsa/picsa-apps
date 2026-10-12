import { TestBed } from '@angular/core/testing';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ForecastService, isLiveForecast, isStubForecast, shouldUseBypassStubs } from './forecast.service';

/** Minimal stand-in for cached RxDB docs (reconcile only reads ids) */
const cachedDoc = (id: string) => ({ id });

/** Chainable thenable stub for PostgREST query builders (`await query` resolves the canned response) */
function mockTableQuery(result: { data: any[] | null; error?: any }) {
  const builder: any = {};
  for (const method of ['select', 'eq', 'neq', 'in', 'gt', 'order', 'limit']) {
    builder[method] = jest.fn(() => builder);
  }
  builder.then = (resolve: (value: unknown) => void) => resolve(result);
  return builder;
}

describe('ForecastService forecast predicates', () => {
  describe('isStubForecast', () => {
    it('identifies locally-generated stub ids', () => {
      expect(isStubForecast({ id: 'stub/daily/mw' } as any)).toBe(true);
      expect(isStubForecast({ id: 'stub/weekly/zm' } as any)).toBe(true);
    });

    it('rejects server-synced forecast ids', () => {
      expect(isStubForecast({ id: '2026/seasonal/zm_en' } as any)).toBe(false);
      expect(isStubForecast({ id: '2025/downscaled/balaka/mw_en' } as any)).toBe(false);
    });

    it('handles missing docs', () => {
      expect(isStubForecast(undefined)).toBe(false);
    });
  });

  describe('isLiveForecast', () => {
    it('accepts docs with a downloadable file', () => {
      expect(isLiveForecast({ storage_file: 'mw/forecasts/seasonal/2026/mw_en.pdf' })).toBe(true);
    });

    it('rejects tombstoned rows (null file) and empty paths', () => {
      expect(isLiveForecast({ storage_file: null } as any)).toBe(false);
      expect(isLiveForecast({ storage_file: '' })).toBe(false);
    });
  });

  describe('shouldUseBypassStubs', () => {
    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    it('is disabled by default (no flag)', () => {
      window.history.replaceState({}, '', '/forecasts');
      expect(shouldUseBypassStubs()).toBe(false);
    });

    it('accepts ?bypassStubs=true', () => {
      window.history.replaceState({}, '', '/forecasts?bypassStubs=true');
      expect(shouldUseBypassStubs()).toBe(true);
    });

    it('accepts flag-only ?bypassStubs', () => {
      window.history.replaceState({}, '', '/forecasts?bypassStubs');
      expect(shouldUseBypassStubs()).toBe(true);
    });

    it('matches case-insensitively', () => {
      window.history.replaceState({}, '', '/forecasts?BYPASSSTUBS=True');
      expect(shouldUseBypassStubs()).toBe(true);
    });

    it('rejects explicit false values', () => {
      window.history.replaceState({}, '', '/forecasts?bypassStubs=false');
      expect(shouldUseBypassStubs()).toBe(false);
    });

    it('ignores unrelated query params', () => {
      window.history.replaceState({}, '', '/forecasts?other=1');
      expect(shouldUseBypassStubs()).toBe(false);
    });
  });
});

describe('ForecastService tombstone reconcile', () => {
  let service: ForecastService;
  let mockSupabase: any;
  let mockCollection: any;
  let tableSpy: jest.Mock;

  const seedServerRows = (rows: any[] | null, error: any = null) => {
    tableSpy.mockReturnValue(mockTableQuery({ data: rows, error }));
  };

  const seedCachedDocs = (ids: string[]) => {
    mockCollection.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(ids.map(cachedDoc)) });
  };

  const reconcile = (scope: any) => (service as any).reconcileForecastTombstones(scope);

  beforeEach(async () => {
    mockCollection = {
      find: jest.fn(),
      bulkRemove: jest.fn().mockResolvedValue([]),
      bulkUpsert: jest.fn(),
    };
    tableSpy = jest.fn();
    mockSupabase = {
      ready: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockReturnValue(true),
      db: { table: tableSpy },
    };
    TestBed.configureTestingModule({
      providers: [
        ForecastService,
        { provide: SupabaseService, useValue: mockSupabase },
        {
          provide: PicsaDatabase_V2_Service,
          useValue: {
            ensureCollections: jest.fn().mockResolvedValue(undefined),
            db: { collections: { forecasts: mockCollection } },
          },
        },
        { provide: PicsaDatabaseAttachmentService, useValue: { ready: jest.fn().mockResolvedValue(undefined) } },
      ],
    });
    service = TestBed.inject(ForecastService);
    await service.ready();
    window.history.replaceState({}, '', '/');
  });

  it('removes locally-cached docs tombstoned on the server', async () => {
    seedServerRows([{ id: '2025/seasonal/mw_en', storage_file: null }]);
    seedCachedDocs(['2025/seasonal/mw_en']);

    const removed = await reconcile({ country_code: 'mw', forecast_type: 'seasonal' });

    expect(removed).toEqual(['2025/seasonal/mw_en']);
    expect(mockCollection.bulkRemove).toHaveBeenCalledWith(['2025/seasonal/mw_en']);
  });

  it('ignores server tombstones with no local doc', async () => {
    seedServerRows([{ id: '2025/seasonal/mw_en', storage_file: null }]);
    seedCachedDocs([]);

    const removed = await reconcile({ country_code: 'mw', forecast_type: 'seasonal' });

    expect(removed).toEqual([]);
    expect(mockCollection.bulkRemove).not.toHaveBeenCalled();
  });

  it('keeps cached docs missing from the server response (no orphan deletion)', async () => {
    // Regression test: an empty dev database must not cannibalise valid
    // bundle-seeded docs on every load - only positive tombstones delete
    seedServerRows([]);
    seedCachedDocs(['2026/seasonal/zm_en']);

    const removed = await reconcile({ country_code: 'zm', forecast_type: 'seasonal' });

    expect(removed).toEqual([]);
    expect(mockCollection.bulkRemove).not.toHaveBeenCalled();
  });

  it('never removes live server rows', async () => {
    seedServerRows([{ id: '2026/seasonal/zm_en', storage_file: 'zm/forecasts/seasonal/2026/zm_en.pdf' }]);
    seedCachedDocs(['2026/seasonal/zm_en']);

    const removed = await reconcile({ country_code: 'zm', forecast_type: 'seasonal' });

    expect(removed).toEqual([]);
    expect(mockCollection.bulkRemove).not.toHaveBeenCalled();
  });

  it('skips entirely when offline', async () => {
    mockSupabase.isAvailable.mockReturnValue(false);
    seedCachedDocs(['2026/seasonal/zm_en']);

    const removed = await reconcile({ country_code: 'zm', forecast_type: 'seasonal' });

    expect(tableSpy).not.toHaveBeenCalled();
    expect(mockCollection.bulkRemove).not.toHaveBeenCalled();
    expect(removed).toEqual([]);
  });

  it('keeps local docs when the tombstone query errors', async () => {
    seedServerRows(null, new Error('connection reset'));
    seedCachedDocs(['2026/seasonal/zm_en']);

    const removed = await reconcile({ country_code: 'zm', forecast_type: 'seasonal' });

    expect(removed).toEqual([]);
    expect(mockCollection.bulkRemove).not.toHaveBeenCalled();
  });

  it('scopes downscaled reconcile to the requested locations only', async () => {
    seedServerRows([{ id: '2026/downscaled/eastern/zm_en', storage_file: null }]);
    seedCachedDocs(['2026/downscaled/eastern/zm_en', '2026/downscaled/southern/zm_en']);

    const removed = await reconcile({
      country_code: 'zm',
      forecast_type: 'downscaled',
      downscaled_location: ['eastern', 'southern'],
    });

    // Only the tombstoned id is removed - the live southern doc is untouched
    expect(removed).toEqual(['2026/downscaled/eastern/zm_en']);
    expect(mockCollection.bulkRemove).toHaveBeenCalledWith(['2026/downscaled/eastern/zm_en']);
    // Local reads use an $in selector covering both locations
    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: expect.objectContaining({ downscaled_location: { $in: ['eastern', 'southern'] } }),
      }),
    );
  });

  it('omits the country filter for global queries', async () => {
    seedServerRows([]);
    seedCachedDocs([]);

    await reconcile({ country_code: 'global', forecast_type: 'seasonal' });

    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({ selector: expect.not.objectContaining({ country_code: expect.anything() }) }),
    );
  });
});

describe('ForecastService cached stub handling', () => {
  let service: ForecastService;
  let mockSupabase: any;
  let mockCollection: any;

  beforeEach(async () => {
    mockCollection = {
      find: jest.fn(),
      bulkRemove: jest.fn().mockResolvedValue([]),
      bulkUpsert: jest.fn(),
    };
    mockSupabase = {
      ready: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockReturnValue(true),
      db: { table: jest.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        ForecastService,
        { provide: SupabaseService, useValue: mockSupabase },
        {
          provide: PicsaDatabase_V2_Service,
          useValue: {
            ensureCollections: jest.fn().mockResolvedValue(undefined),
            db: { collections: { forecasts: mockCollection } },
          },
        },
        { provide: PicsaDatabaseAttachmentService, useValue: { ready: jest.fn().mockResolvedValue(undefined) } },
      ],
    });
    service = TestBed.inject(ForecastService);
    await service.ready();
    window.history.replaceState({}, '', '/');
  });

  const loadCached = (country: string, type: any, limit?: number) =>
    (service as any).loadCachedForecasts(country, type, limit);

  it('purges cached stubs and returns nothing when bypassing with an empty cache', async () => {
    window.history.replaceState({}, '', '/forecasts?bypassStubs=true');
    mockCollection.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([cachedDoc('stub/weekly/zm')]) });

    const docs = await loadCached('zm', 'weekly', 1);

    expect(docs).toEqual([]);
    expect(mockCollection.bulkRemove).toHaveBeenCalledWith(['stub/weekly/zm']);
  });

  it('purges stubs but keeps real cached forecasts', async () => {
    mockCollection.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([cachedDoc('stub/weekly/zm'), cachedDoc('2026,07,15/weekly-report.pdf')]),
    });

    const docs = await loadCached('zm', 'weekly', 1);

    expect(docs.map((d: any) => d.id)).toEqual(['2026,07,15/weekly-report.pdf']);
    expect(mockCollection.bulkRemove).toHaveBeenCalledWith(['stub/weekly/zm']);
  });

  it('preserves stubs as fallback when not bypassing and nothing real is cached', async () => {
    mockCollection.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([cachedDoc('stub/weekly/zm')]) });

    const docs = await loadCached('zm', 'weekly', 1);

    expect(docs.map((d: any) => d.id)).toEqual(['stub/weekly/zm']);
    expect(mockCollection.bulkRemove).not.toHaveBeenCalled();
  });
});

describe('ForecastService offline download guard', () => {
  let service: ForecastService;
  let mockSupabase: any;
  let mockAttachment: any;
  let downloader: any;

  const doc = { id: '2026/weekly/zm_en' } as any;

  beforeEach(async () => {
    mockSupabase = {
      ready: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockReturnValue(true),
      storage: { getPublicLink: jest.fn() },
    };
    mockAttachment = {
      ready: jest.fn().mockResolvedValue(undefined),
      putAttachment: jest.fn().mockResolvedValue(doc),
    };
    downloader = {
      start: jest.fn().mockResolvedValue(undefined),
      completed: jest.fn(),
      storage_path: jest.fn().mockReturnValue('zm/forecasts/weekly/2026/zm_en.pdf'),
    };
    TestBed.configureTestingModule({
      providers: [
        ForecastService,
        { provide: SupabaseService, useValue: mockSupabase },
        {
          provide: PicsaDatabase_V2_Service,
          useValue: {
            ensureCollections: jest.fn().mockResolvedValue(undefined),
            db: { collections: { forecasts: {} } },
          },
        },
        { provide: PicsaDatabaseAttachmentService, useValue: mockAttachment },
      ],
    });
    service = TestBed.inject(ForecastService);
    await service.ready();
  });

  it('rejects download while server unavailable without touching storage', async () => {
    mockSupabase.isAvailable.mockReturnValue(false);

    await expect(service.downloadForecastFile(doc, downloader)).rejects.toThrow('offline');
    expect(downloader.start).not.toHaveBeenCalled();
    expect(mockSupabase.storage.getPublicLink).not.toHaveBeenCalled();
  });

  it('surfaces downloader errors as download failures', async () => {
    downloader.completed.mockResolvedValue({ error: new Error('network reset'), data: undefined });

    await expect(service.downloadForecastFile(doc, downloader)).rejects.toThrow('Download failed');
    expect(mockAttachment.putAttachment).not.toHaveBeenCalled();
  });

  it('stores downloaded blobs as attachments', async () => {
    const blob = new Blob(['pdf-bytes'], { type: 'application/pdf' });
    downloader.completed.mockResolvedValue({ error: null, data: blob });

    await service.downloadForecastFile(doc, downloader);

    expect(mockAttachment.putAttachment).toHaveBeenCalledWith(doc, 'zm/forecasts/weekly/2026/zm_en.pdf', blob);
  });
});

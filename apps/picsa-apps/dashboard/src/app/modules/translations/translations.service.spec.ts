import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { TranslationsXlsxExportService } from './services/translations-xlsx-export.service';
import { TranslationDashboardService } from './translations.service';

describe('TranslationDashboardService', () => {
  let service: TranslationDashboardService;
  let mockSupabase: any;
  let mockDeployment: any;
  let mockXlsxExportService: { exportTranslations: jest.Mock };

  beforeEach(() => {
    mockSupabase = {
      ready: () => Promise.resolve(),
      db: {
        table: (tableName: string) => {
          return {
            select: () => {
              const query: any = {
                or: (filterStr: string) => {
                  mockSupabase.lastFilter = filterStr;
                  return Promise.resolve({ data: mockSupabase.mockData, error: null });
                },
                then: (resolve: any) => {
                  mockSupabase.lastFilter = '';
                  return Promise.resolve({ data: mockSupabase.mockData, error: null }).then(resolve);
                },
              };
              return query;
            },
            insert: (data: any[]) => {
              mockSupabase.lastInsert = data;
              return Promise.resolve({ data, error: null });
            },
          };
        },
      },
      lastFilter: '',
      lastInsert: null as any,
      mockData: [] as any[],
    };

    mockDeployment = {
      activeDeployment: signal<any>(null),
      activeDeploymentCountry: signal<string>('mw'),
    };

    mockXlsxExportService = {
      exportTranslations: jest.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        TranslationDashboardService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: DeploymentDashboardService, useValue: mockDeployment },
        { provide: TranslationsXlsxExportService, useValue: mockXlsxExportService },
      ],
    });

    service = TestBed.inject(TranslationDashboardService);
  });

  it('should generate translation ID if not present', async () => {
    const entry = {
      tool: 'crops',
      context: 'crop-list',
      text: 'Maize',
    };
    const id = service.generateTranslationID(entry);
    expect(id).toBe('crops-croplist-maize');
  });

  it('should include country code in generated translation ID if country_code is set', async () => {
    const entry = {
      country_code: 'mw',
      tool: 'crops',
      context: 'crop-list',
      text: 'Maize',
    };
    const id = service.generateTranslationID(entry);
    expect(id).toBe('mw-crops-croplist-maize');
  });

  it('should preserve custom translation ID if present', async () => {
    const entry = {
      id: 'mw:climate.chart.end.definition',
      country_code: 'mw',
      tool: 'climate',
      context: 'chart',
      text: 'End definition',
    };
    await service.addTranslation(entry);
    expect(mockSupabase.lastInsert[0].id).toBe('mw:climate.chart.end.definition');
  });

  it('should filter by active deployment country code', async () => {
    mockDeployment.activeDeployment.set({ country_code: 'mw' });
    await service.listTranslations();
    expect(mockSupabase.lastFilter).toContain('country_code.eq.mw');

    mockDeployment.activeDeployment.set(null);
    await service.listTranslations();
    expect(mockSupabase.lastFilter).toContain('country_code.is.null,country_code.eq.global');
  });

  it('should export correct JSON structure with standard and custom keys', () => {
    service.translations.set([
      {
        id: 'crops-crop-list-maize',
        country_code: 'mw',
        tool: 'crops',
        context: 'crop-list',
        text: 'Vaccine',
        mw_ny: 'Katambala',
      },
      {
        id: 'mw:climate.chart.end.definition',
        country_code: 'mw',
        tool: 'climate',
        context: 'chart',
        text: 'End definition',
        mw_ny: 'Tanthauzo lomaliza',
      },
    ] as any[]);

    const json = service.exportJson('mw_ny');
    // Standard translation key should be the English text
    expect(json['Vaccine']).toBe('Katambala');
    // Custom ID translation should be present under its text AND its custom ID
    expect(json['End definition']).toBe('Tanthauzo lomaliza');
    expect(json['mw:climate.chart.end.definition']).toBe('Tanthauzo lomaliza');
  });

  it('should delegate exportXlsx to TranslationsXlsxExportService with active country and non-archived translations', async () => {
    service.translations.set([
      {
        id: 'entry-1',
        country_code: 'mw',
        tool: 'crops',
        context: 'crop-list',
        text: 'Maize',
        mw_ny: 'Chimanga',
        archived: false,
      },
      {
        id: 'entry-2',
        country_code: 'mw',
        tool: 'crops',
        context: 'crop-list',
        text: 'Old Archived Item',
        archived: true,
      },
    ] as any[]);

    await service.exportXlsx('mw');

    expect(mockXlsxExportService.exportTranslations).toHaveBeenCalledTimes(1);
    const [options] = mockXlsxExportService.exportTranslations.mock.calls[0];
    expect(options.countryCode).toBe('mw');
    expect(options.translations.length).toBe(1);
    expect(options.translations[0].id).toBe('entry-1');
  });
});

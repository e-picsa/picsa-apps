import { TestBed } from '@angular/core/testing';
import { LOCALES_DATA } from '@picsa/data';
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
      ready: jest.fn().mockResolvedValue(true),
      db: {
        table: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockImplementation((filter: string) => {
            mockSupabase.lastFilter = filter;
            return Promise.resolve({ data: mockSupabase.mockData || [], error: null });
          }),
        }),
      },
    };

    mockDeployment = {
      activeDeployment: jest.fn(),
      activeDeploymentCountry: jest.fn().mockReturnValue('mw'),
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

  it('should generate translation ID if not present', () => {
    const row = {
      tool: 'crop-info',
      context: 'variety',
      text: 'Early Maturing',
    };
    const id = service.generateTranslationID(row);
    expect(id).toBe('cropinfo-variety-earlymaturing');
  });

  it('should include country code in generated translation ID if country_code is set', () => {
    const row = {
      tool: 'crop-info',
      context: 'variety',
      text: 'Early Maturing',
      country_code: 'mw',
    };
    const id = service.generateTranslationID(row);
    expect(id).toBe('mw-cropinfo-variety-earlymaturing');
  });

  it('should preserve custom translation ID if present', async () => {
    const rowWithCustomId = {
      id: 'custom-id-123',
      tool: 'crop-info',
      context: 'variety',
      text: 'Early Maturing',
    };

    let insertedData: any;
    mockSupabase.db.table = jest.fn().mockReturnValue({
      insert: jest.fn().mockImplementation((data) => {
        insertedData = data;
        return Promise.resolve({ data, error: null });
      }),
    });

    await service.addTranslation(rowWithCustomId);
    expect(insertedData[0].id).toBe('custom-id-123');
  });

  it('should filter by active deployment country code', async () => {
    mockDeployment.activeDeployment.mockReturnValue({ country_code: 'mw' });
    mockSupabase.mockData = [
      { id: 'global-1', tool: 'climate', text: 'Global text', country_code: null },
      { id: 'mw:climate.chart.1', tool: 'climate', text: 'Malawi override', country_code: 'mw' },
    ];

    await service.listTranslations();
    expect(mockSupabase.lastFilter).toContain('country_code.eq.mw');
    expect(mockSupabase.lastFilter).toContain('country_code.is.null');
    expect(service.translations().length).toBe(2);
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
        mw_ny: 'Zakale',
        archived: true,
      },
    ] as any[]);

    await service.exportXlsx('mw');

    expect(mockXlsxExportService.exportTranslations).toHaveBeenCalledTimes(1);
    const [options] = mockXlsxExportService.exportTranslations.mock.calls[0];
    expect(options.countryCode).toBe('mw');
    expect(options.translations.length).toBe(1);
    expect(options.translations[0].id).toBe('entry-1');
    const expectedLocales = LOCALES_DATA.filter((v) => v.country_code === 'mw' && !v.language_code.includes('en'));
    expect(options.locales).toEqual(expectedLocales);
  });
});

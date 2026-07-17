import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { TranslationDashboardService } from './translations.service';

describe('TranslationDashboardService', () => {
  let service: TranslationDashboardService;
  let mockSupabase: any;
  let mockDeployment: any;

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
    };

    TestBed.configureTestingModule({
      providers: [
        TranslationDashboardService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: DeploymentDashboardService, useValue: mockDeployment },
      ],
    });

    service = TestBed.inject(TranslationDashboardService);
  });

  it('should generate translation ID if not present', async () => {
    const entry = {
      tool: 'budget',
      context: 'inputs',
      text: 'Vaccine',
    };
    await service.addTranslation(entry as any);
    expect(mockSupabase.lastInsert[0].id).toBe('budget-inputs-vaccine');
  });

  it('should preserve custom translation ID if present', async () => {
    const entry = {
      id: 'custom:id:for:vaccine',
      tool: 'budget',
      context: 'inputs',
      text: 'Vaccine',
    };
    await service.addTranslation(entry as any);
    expect(mockSupabase.lastInsert[0].id).toBe('custom:id:for:vaccine');
  });

  it('should filter by active deployment country code', async () => {
    mockDeployment.activeDeployment.set({ country_code: 'mw' });
    mockSupabase.mockData = [
      { id: 'global-1', tool: 'climate', text: 'Global text', country_code: null },
      { id: 'mw:climate.chart.1', tool: 'climate', text: 'Malawi override', country_code: 'mw' },
    ];

    await service.listTranslations();
    expect(mockSupabase.lastFilter).toContain('country_code.eq.mw');
    expect(mockSupabase.lastFilter).toContain('country_code.is.null');
    expect(service.translations().length).toBe(2);
  });

  it('should export correct JSON structure with standard and custom keys', () => {
    service.translations.set([
      { id: 'budget-inputs-vaccine', tool: 'budget', context: 'inputs', text: 'Vaccine', mw_ny: 'Katambala' },
      {
        id: 'mw:climate.chart.end.definition',
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
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../../deployment/deployment.service';
import { CropInformationService } from './crop-information.service';

describe('CropInformationService', () => {
  let service: CropInformationService;
  let mockSupabase: any;
  let mockDeployment: any;
  let mockNotification: any;

  beforeEach(() => {
    mockSupabase = {
      ready: () => Promise.resolve(),
      db: {
        table: (tableName: string) => {
          mockSupabase.lastTable = tableName;
          return {
            select: () => {
              const query: any = {
                eq: (column: string, val: any) => {
                  mockSupabase.queries[tableName] ??= {};
                  mockSupabase.queries[tableName][column] = val;
                  return query;
                },
                order: () => Promise.resolve({ data: mockSupabase.mockData[tableName] || [], error: null }),
                then: (resolve: any) =>
                  Promise.resolve({ data: mockSupabase.mockData[tableName] || [], error: null }).then(resolve),
              };
              return query;
            },
            insert: (data: any[]) => {
              mockSupabase.lastInsert = data;
              return Promise.resolve({ data, error: null });
            },
            upsert: (data: any[]) => {
              mockSupabase.lastUpsert = data;
              return Promise.resolve({ data, error: null });
            },
            update: (updateData: any) => {
              mockSupabase.lastUpdate = updateData;
              const updateQuery: any = {
                eq: (column: string, val: any) => {
                  mockSupabase.updateFilter[column] = val;
                  return updateQuery;
                },
              };
              return updateQuery;
            },
            delete: () => {
              const deleteQuery: any = {
                eq: (column: string, val: any) => {
                  mockSupabase.deleteFilter[column] = val;
                  return deleteQuery;
                },
              };
              return deleteQuery;
            },
          };
        },
      },
      queries: {},
      lastInsert: null as any,
      lastUpsert: null as any,
      lastUpdate: null as any,
      updateFilter: {} as Record<string, any>,
      deleteFilter: {} as Record<string, any>,
      mockData: {
        crop_data: [],
        crop_data_downscaled: [],
      } as Record<string, any[]>,
    };

    mockDeployment = {
      activeDeployment: signal({ country_code: 'zm' }),
    };

    mockNotification = {
      showSuccessNotification: jest.fn(),
      showErrorNotification: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CropInformationService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: DeploymentDashboardService, useValue: mockDeployment },
        { provide: PicsaNotificationService, useValue: mockNotification },
      ],
    });

    service = TestBed.inject(CropInformationService);
  });

  it('should query crop_data and crop_data_downscaled using active deployment country_code', async () => {
    mockDeployment.activeDeployment.set({ country_code: 'zw' });
    mockSupabase.mockData.crop_data = [{ id: 'zw/maize/SC-555', crop: 'maize', variety: 'SC-555', country_code: 'zw' }];
    mockSupabase.mockData.crop_data_downscaled = [
      { id: 'zw/location1', country_code: 'zw', location_id: 'location1', water_requirements: {} },
    ];

    await service['loadCropData']();

    expect(mockSupabase.queries.crop_data.country_code).toBe('zw');
    expect(mockSupabase.queries.crop_data_downscaled.country_code).toBe('zw');
    expect(service.cropData().length).toBe(1);
  });

  it('should pass rows directly to crop_data table insert', async () => {
    const newRows: any[] = [
      {
        country_code: 'zm',
        crop: 'maize',
        variety: 'PAN-413',
        maturity_period: 'early',
        days_lower: 120,
        days_upper: 135,
      },
    ];

    await service.insert(newRows);

    expect(mockSupabase.lastInsert).toBeDefined();
    expect(mockSupabase.lastInsert[0].country_code).toBe('zm');
  });

  it('should pass rows directly to crop_data table upsert', async () => {
    const upsertRows: any[] = [
      { country_code: 'mw', crop: 'beans', variety: 'KWARE', maturity_period: 'early', days_lower: 75, days_upper: 75 },
    ];

    await service.upsert(upsertRows);

    expect(mockSupabase.lastUpsert).toBeDefined();
    expect(mockSupabase.lastUpsert[0].country_code).toBe('mw');
  });

  it('should filter update queries by id', async () => {
    await service.update({ id: 'zm/maize/PAN-413', days_lower: 110 } as any);

    expect(mockSupabase.updateFilter.id).toBe('zm/maize/PAN-413');
  });

  it('should filter delete queries by id', async () => {
    await service.delete('zm/maize/PAN-413');

    expect(mockSupabase.deleteFilter.id).toBe('zm/maize/PAN-413');
  });

  it('should correctly merge baseline crop data with downscaled water requirements', () => {
    const cropData: any[] = [
      {
        id: 'zm/maize/SC-513',
        country_code: 'zm',
        crop: 'maize',
        variety: 'SC-513',
        maturity_period: 'early',
        days_lower: 120,
        days_upper: 130,
      },
    ];

    const downscaledData: any[] = [
      {
        id: 'zm/loc1',
        country_code: 'zm',
        location_id: 'loc1',
        water_requirements: {
          maize: {
            'SC-513': 450,
          },
        },
      },
    ];

    service.cropData.set(cropData);
    service.downscaledData.set(downscaledData);

    const merged = service.cropDataMerged();
    expect(merged.length).toBe(1);
    expect(merged[0].downscaled).toEqual([{ location_id: 'loc1', water_requirement: 450 }]);
  });
});

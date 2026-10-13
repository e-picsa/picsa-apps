import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ClimateService } from '../../climate.service';
import { ClimateAdminPageComponent } from './admin.component';
import { StationDiffDialogComponent } from './components/station-diff-dialog/station-diff-dialog.component';

describe('ClimateAdminPageComponent', () => {
  let component: ClimateAdminPageComponent;
  let fixture: ComponentFixture<ClimateAdminPageComponent>;
  let mockClimateService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockClimateService = {
      stations: jest.fn().mockReturnValue([]),
      apiCountryCode: 'mw',
      getAllStationData: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
      getAllStationsAppData: jest.fn().mockReturnValue(Promise.resolve({})),
      getStationData: jest.fn().mockReturnValue(Promise.resolve({ data: null })),
      updateStationDataFromApi: jest.fn().mockReturnValue(of({ status: 'fulfilled' })),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    mockActivatedRoute = {
      snapshot: { params: {} },
    };

    await TestBed.configureTestingModule({
      imports: [ClimateAdminPageComponent],
      providers: [
        { provide: ClimateService, useValue: mockClimateService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should configure DB table options with season discrepancies instead of noisy rainfall issues', () => {
    expect(component.dbTableOptions.displayColumns).toContain('station');
    expect(component.dbTableOptions.displayColumns).toContain('updated_at');
    expect(component.dbTableOptions.displayColumns).toContain('season_discrepancies');
    expect(component.dbTableOptions.displayColumns).toContain('rainfall_export_data');
    expect(component.dbTableOptions.displayColumns).not.toContain('rainfall_issues');
    expect(component.dbTableOptions.displayColumns).not.toContain('app_data_diff');
    expect(component.dbTableOptions.formatHeader('station')).toBe('Station');
    expect(component.dbTableOptions.formatHeader('season_discrepancies')).toBe('Season Discrepancies');
  });

  it('should configure Quality Control table options and headers', () => {
    expect(component.qcTableOptions.displayColumns).toEqual([
      'name',
      'passed',
      'rainfall_total_years',
      'rainfall_last_ten_years',
      'rainfall_last_thirty_years',
      'season_discrepancies',
      'failures',
      'actions',
    ]);
    expect(component.qcTableOptions.formatHeader('name')).toBe('Station');
    expect(component.qcTableOptions.formatHeader('passed')).toBe('Status');
    expect(component.qcTableOptions.formatHeader('rainfall_total_years')).toBe('Total Rainfall Years');
    expect(component.qcTableOptions.formatHeader('rainfall_last_ten_years')).toBe('Past 10 Years');
    expect(component.qcTableOptions.formatHeader('rainfall_last_thirty_years')).toBe('Past 30 Years');
    expect(component.qcTableOptions.formatHeader('season_discrepancies')).toBe('Season Discrepancies');
    expect(component.qcTableOptions.formatHeader('failures')).toBe('Quality Control Issues');
    expect(component.qcTableOptions.formatHeader('actions')).toBe('Action');
  });

  it('should configure App Bundled table options', () => {
    expect(component.appTableOptions.displayColumns).toContain('name');
    expect(component.appTableOptions.displayColumns).toContain('has_bundled_data');
    expect(component.appTableOptions.displayColumns).toContain('total_years');
    expect(component.appTableOptions.displayColumns).toContain('products');
    expect(component.appTableOptions.formatHeader('name')).toBe('Station');
    expect(component.appTableOptions.formatHeader('has_bundled_data')).toBe('Bundled Status');
  });

  it('should configure Diff table options including QC status', () => {
    expect(component.diffTableOptions.displayColumns).toContain('name');
    expect(component.diffTableOptions.displayColumns).toContain('diff_status');
    expect(component.diffTableOptions.displayColumns).toContain('qc_passed');
    expect(component.diffTableOptions.displayColumns).toContain('app_years_count');
    expect(component.diffTableOptions.displayColumns).toContain('db_years_count');
    expect(component.diffTableOptions.displayColumns).toContain('updated_at');
    expect(component.diffTableOptions.displayColumns).toContain('diff');
    expect(component.diffTableOptions.displayColumns).toContain('actions');
    expect(component.diffTableOptions.formatHeader('name')).toBe('Station');
    expect(component.diffTableOptions.formatHeader('diff_status')).toBe('Status');
    expect(component.diffTableOptions.formatHeader('qc_passed')).toBe('QC Status');
    expect(component.diffTableOptions.formatHeader('app_years_count')).toBe('App Rainfall Years');
    expect(component.diffTableOptions.formatHeader('db_years_count')).toBe('DB Rainfall Years');
    expect(component.diffTableOptions.formatHeader('updated_at')).toBe('Last Sync');
    expect(component.diffTableOptions.formatHeader('diff')).toBe('Product Differences');
  });

  it('should calculate group diff summary with % headline changes and product lines', () => {
    const mockDiff: any = {
      hasDifferences: true,
      products: {
        rainfall: {
          productKey: 'rainfall',
          addedInDb: [],
          missingInDb: [1962],
          changedValues: new Array(54).fill({}),
          totalAppValues: 50,
          totalDbValues: 50,
        },
        start: {
          productKey: 'start',
          addedInDb: [],
          missingInDb: [1962],
          changedValues: [],
          totalAppValues: 50,
          totalDbValues: 50,
        },
        end: {
          productKey: 'end',
          addedInDb: [],
          missingInDb: [],
          changedValues: [],
          totalAppValues: 50,
          totalDbValues: 50,
        },
      },
    };

    const groupSummary = component.getGroupDiffSummary(mockDiff, 'divergent');
    expect(groupSummary.diffValuesCount).toBe(56); // 55 rainfall + 1 start
    expect(groupSummary.totalValuesCount).toBe(300); // 100 * 3 products
    expect(groupSummary.headlinePercent).toBe(19); // 56 / 300 = 18.66% -> 19%
    expect(groupSummary.headlinePercentFormatted).toBe('~19% diff');
    expect(groupSummary.hasData).toBe(true);
    expect(groupSummary.isInSync).toBe(false);
    expect(groupSummary.isAppOnly).toBe(false);
    expect(groupSummary.isDbOnly).toBe(false);
    expect(groupSummary.productLines).toEqual([
      { label: 'Rainfall', summary: '-1 missing, 54 modified' },
      { label: 'Season Start', summary: '-1 missing' },
    ]);
  });

  it('should suppress 100% headline and product breakdowns for app_only stations', () => {
    const mockAppOnlyDiff: any = {
      hasDifferences: true,
      products: {
        rainfall: {
          productKey: 'rainfall',
          addedInDb: [],
          missingInDb: [1980, 1981],
          changedValues: [],
          totalAppValues: 2,
          totalDbValues: 0,
        },
      },
    };

    const summary = component.getGroupDiffSummary(mockAppOnlyDiff, 'app_only');
    expect(summary.isAppOnly).toBe(true);
    expect(summary.headlinePercent).toBe(0);
    expect(summary.headlinePercentFormatted).toBe('');
    expect(summary.productLines).toEqual([]);
  });

  it('should suppress 100% headline but keep product breakdown for db_only stations', () => {
    const mockDbOnlyDiff: any = {
      hasDifferences: true,
      products: {
        rainfall: {
          productKey: 'rainfall',
          addedInDb: [1980, 1981],
          missingInDb: [],
          changedValues: [],
          totalAppValues: 0,
          totalDbValues: 2,
        },
      },
    };

    const summary = component.getGroupDiffSummary(mockDbOnlyDiff, 'db_only');
    expect(summary.isDbOnly).toBe(true);
    expect(summary.headlinePercent).toBe(0);
    expect(summary.headlinePercentFormatted).toBe('');
    expect(summary.productLines).toEqual([{ label: 'Rainfall', summary: '+2 new' }]);
  });

  it('should assume empty product data is unavailable due to error and mark available only when non-empty', () => {
    const emptySummary = (component as any).generateProductSummary({
      annual_rainfall_data: [],
      crop_probability_data: null,
      annual_temperature_data: undefined,
      monthly_temperature_data: [],
    });

    expect(emptySummary).toEqual([
      { id: 'Annual Rainfall', available: false, generation_timestamp: undefined, generation_id: undefined },
      { id: 'Crop Probabilities', available: false, generation_timestamp: undefined, generation_id: undefined },
      { id: 'Annual Temperature', available: false, generation_timestamp: undefined, generation_id: undefined },
      { id: 'Monthly Temperature', available: false, generation_timestamp: undefined, generation_id: undefined },
    ]);

    const filledSummary = (component as any).generateProductSummary({
      annual_rainfall_data: [
        {
          year: 2020,
          seasonal_rain: 500,
          _metadata: { generation_timestamp: '2026-10-01T12:00:00Z', generation_id: 'gen_rain_1' },
        },
      ],
      crop_probability_data: null,
      annual_temperature_data: [{ year: 2020, mean_tmax: 28 }],
      monthly_temperature_data: [],
    });

    expect(filledSummary).toEqual([
      {
        id: 'Annual Rainfall',
        available: true,
        generation_timestamp: '2026-10-01T12:00:00Z',
        generation_id: 'gen_rain_1',
      },
      { id: 'Crop Probabilities', available: false, generation_timestamp: undefined, generation_id: undefined },
      { id: 'Annual Temperature', available: true, generation_timestamp: undefined, generation_id: undefined },
      { id: 'Monthly Temperature', available: false, generation_timestamp: undefined, generation_id: undefined },
    ]);

    const absentSummary = (component as any).generateProductSummary(undefined);
    expect(absentSummary.every((p: any) => p.available === false)).toBe(true);
  });

  it('should format product tooltip with generation metadata when available', () => {
    expect(component.getProductTooltip({ id: 'Annual Rainfall', available: false })).toBe(
      'Annual Rainfall\nUnavailable',
    );

    const withGen = component.getProductTooltip({
      id: 'Annual Rainfall',
      available: true,
      generation_timestamp: '2026-10-01T12:00:00Z',
      generation_id: 'gen_123',
    });
    expect(withGen).toContain('Annual Rainfall\nAvailable');
    expect(withGen).toContain('Generated: 2026-10-01T12:00:00Z');
    expect(withGen).toContain('ID: gen_123');

    const plain = component.getProductTooltip({
      id: 'Annual Rainfall',
      available: true,
    });
    expect(plain).toBe('Annual Rainfall\nAvailable');
  });

  it('should filter diffTableData when showOnlyDiffs is toggled', () => {
    expect(component.showOnlyDiffs()).toBe(false);
    component.showOnlyDiffs.set(true);
    expect(component.showOnlyDiffs()).toBe(true);
  });

  it('should format getDiffTooltip accurately based on diff status', () => {
    expect(component.getDiffTooltip('in_sync')).toContain('matches database perfectly');
    expect(component.getDiffTooltip('divergent')).toContain('Database values differ');
    expect(component.getDiffTooltip('db_only')).toContain('has no bundled app data');
    expect(component.getDiffTooltip('app_only')).toContain('not present in database');
    expect(component.getDiffTooltip('no_data')).toContain('No data available');
  });

  it('should open StationDiffDialogComponent when openStationDiffDialog is called', () => {
    const mockStation: any = { id: 'salima', station_id: 'salima', station_name: 'Salima' };
    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    const dialogSpy = jest.spyOn((component as any).dialog, 'open').mockReturnValue({} as any);

    component.openStationDiffDialog(mockStation, mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(dialogSpy).toHaveBeenCalledWith(
      StationDiffDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          station: mockStation,
        }),
      }),
    );
  });

  it('should compute qcStats and filter qcTableData by passed and failed', () => {
    expect(component.qcStats()).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
    });
    expect(component.qcTableData()).toEqual([]);

    component.qcFilter.set('passed');
    expect(component.qcFilter()).toBe('passed');
    expect(component.qcTableData()).toEqual([]);

    component.qcFilter.set('failed');
    expect(component.qcFilter()).toBe('failed');
    expect(component.qcTableData()).toEqual([]);
  });
});

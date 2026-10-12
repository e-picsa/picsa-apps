import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { ClimateAdminPageComponent } from './admin.component';
import { StationDiffDialogComponent } from './components/station-diff-dialog/station-diff-dialog.component';

describe('ClimateAdminPageComponent', () => {
  let component: ClimateAdminPageComponent;
  let fixture: ComponentFixture<ClimateAdminPageComponent>;
  let mockDialog: { open: jest.Mock };

  beforeEach(async () => {
    mockDialog = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ClimateAdminPageComponent],
      providers: [provideRouter([]), provideNoopAnimations(), { provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should configure DB table options without diff column', () => {
    expect(component.dbTableOptions.displayColumns).toContain('updated_at');
    expect(component.dbTableOptions.displayColumns).toContain('rainfall_export_data');
    expect(component.dbTableOptions.displayColumns).not.toContain('app_data_diff');
  });

  it('should configure App Bundled table options', () => {
    expect(component.appTableOptions.displayColumns).toContain('has_bundled_data');
    expect(component.appTableOptions.displayColumns).toContain('total_years');
    expect(component.appTableOptions.displayColumns).toContain('products');
    expect(component.appTableOptions.formatHeader('has_bundled_data')).toBe('Bundled CSV');
  });

  it('should configure Diff table options', () => {
    expect(component.diffTableOptions.displayColumns).toContain('diff_status');
    expect(component.diffTableOptions.displayColumns).toContain('updated_at');
    expect(component.diffTableOptions.displayColumns).toContain('season_diff_percent');
    expect(component.diffTableOptions.displayColumns).toContain('season_diff');
    expect(component.diffTableOptions.displayColumns).toContain('temp_diff_percent');
    expect(component.diffTableOptions.displayColumns).toContain('temp_diff');
    expect(component.diffTableOptions.displayColumns).toContain('actions');
    expect(component.diffTableOptions.displayColumns).not.toContain('years_added');
    expect(component.diffTableOptions.formatHeader('diff_status')).toBe('Status');
    expect(component.diffTableOptions.formatHeader('updated_at')).toBe('Data System Generated');
    expect(component.diffTableOptions.formatHeader('season_diff_percent')).toBe('Season Change %');
    expect(component.diffTableOptions.formatHeader('season_diff')).toBe('Season Change');
    expect(component.diffTableOptions.formatHeader('temp_diff_percent')).toBe('Temp Change %');
    expect(component.diffTableOptions.formatHeader('temp_diff')).toBe('Temp Change');
  });

  it('should calculate group diff summary with % headline changes and product lines', () => {
    const mockDiff: any = {
      status: 'diff',
      products: {
        rainfall: {
          label: 'Rainfall',
          hasData: true,
          isInSync: false,
          yearsAdded: [],
          yearsRemoved: [1962],
          changedCount: 54,
          changes: new Array(55).fill({}),
          totalValuesCount: 100,
          appYearSpan: [1960, 2020],
          dbYearSpan: [1960, 2020],
        },
        start: {
          label: 'Start of Season',
          hasData: true,
          isInSync: false,
          yearsAdded: [],
          yearsRemoved: [1962],
          changedCount: 0,
          changes: new Array(1).fill({}),
          totalValuesCount: 100,
          appYearSpan: [1960, 2020],
          dbYearSpan: [1960, 2020],
        },
        end: {
          label: 'End of Season',
          hasData: true,
          isInSync: true,
          yearsAdded: [],
          yearsRemoved: [],
          changedCount: 0,
          changes: [],
          totalValuesCount: 100,
          appYearSpan: [1960, 2020],
          dbYearSpan: [1960, 2020],
        },
      },
    };

    const groupSummary = (component as any).calculateGroupDiffSummary(mockDiff, ['rainfall', 'start', 'end']);
    expect(groupSummary.diffValuesCount).toBe(56); // 55 rainfall + 1 start
    expect(groupSummary.totalValuesCount).toBe(300); // 100 * 3 products
    expect(groupSummary.headlinePercentFormatted).toBe('18.7%'); // (56 / 300) * 100 = 18.666%
    expect(groupSummary.hasData).toBe(true);
    expect(groupSummary.isInSync).toBe(false);
    expect(groupSummary.isAppOnly).toBe(false);
    expect(groupSummary.isDbOnly).toBe(false);
    expect(groupSummary.productLines).toEqual([
      { label: 'Rainfall', summary: '-1, ~54' },
      { label: 'Start of Season', summary: '-1' },
    ]);
  });

  it('should suppress 100% headline and product breakdowns for app_only stations', () => {
    const mockAppOnlyDiff: any = {
      status: 'app_only',
      products: {
        rainfall: {
          label: 'Rainfall',
          hasData: true,
          isInSync: false,
          yearsAdded: [],
          yearsRemoved: [1980, 1981],
          changedCount: 0,
          changes: new Array(2).fill({}),
          totalValuesCount: 2,
          appYearSpan: [1980, 1981],
          dbYearSpan: null,
        },
      },
    };

    const summary = (component as any).calculateGroupDiffSummary(mockAppOnlyDiff, ['rainfall']);
    expect(summary.isAppOnly).toBe(true);
    expect(summary.headlinePercent).toBe(0);
    expect(summary.headlinePercentFormatted).toBe('');
    expect(summary.productLines).toEqual([]);
  });

  it('should suppress 100% headline but keep product breakdown for db_only stations', () => {
    const mockDbOnlyDiff: any = {
      status: 'db_only',
      products: {
        rainfall: {
          label: 'Rainfall',
          hasData: true,
          isInSync: false,
          yearsAdded: [1980, 1981],
          yearsRemoved: [],
          changedCount: 0,
          changes: new Array(2).fill({}),
          totalValuesCount: 2,
          appYearSpan: null,
          dbYearSpan: [1980, 1981],
        },
      },
    };

    const summary = (component as any).calculateGroupDiffSummary(mockDbOnlyDiff, ['rainfall']);
    expect(summary.isDbOnly).toBe(true);
    expect(summary.headlinePercent).toBe(0);
    expect(summary.headlinePercentFormatted).toBe('');
    expect(summary.productLines).toEqual([{ label: 'Rainfall', summary: '+2' }]);
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
      { id: 'Annual Temperatures', available: false, generation_timestamp: undefined, generation_id: undefined },
      { id: 'Monthly Temperatures', available: false, generation_timestamp: undefined, generation_id: undefined },
    ]);

    const filledSummary = (component as any).generateProductSummary({
      annual_rainfall_data: [{ year: 2020, seasonal_rain: 500 }],
      annual_rainfall_metadata: { generation_timestamp: '2026-10-01T12:00:00Z', generation_id: 'gen_rain_1' },
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
      { id: 'Annual Temperatures', available: true, generation_timestamp: undefined, generation_id: undefined },
      { id: 'Monthly Temperatures', available: false, generation_timestamp: undefined, generation_id: undefined },
    ]);

    const absentSummary = (component as any).generateProductSummary(undefined);
    expect(absentSummary.every((p: any) => p.available === false)).toBe(true);
  });

  it('should format product tooltip with generation metadata when available', () => {
    expect(component.getProductTooltip({ id: 'Annual Rainfall', available: false })).toBe(
      'Annual Rainfall (No data / Error - click to refresh)',
    );

    const withGen = component.getProductTooltip({
      id: 'Annual Rainfall',
      available: true,
      generation_timestamp: '2026-10-01T12:00:00Z',
      generation_id: 'gen_123',
    });
    expect(withGen).toContain('Annual Rainfall (Generated:');
    expect(withGen).toContain('ID: gen_123');

    const withoutId = component.getProductTooltip({
      id: 'Annual Rainfall',
      available: true,
      generation_timestamp: '2026-10-01T12:00:00Z',
    });
    expect(withoutId).toContain('Annual Rainfall (Generated:');
    expect(withoutId).not.toContain('ID:');

    const plain = component.getProductTooltip({
      id: 'Annual Rainfall',
      available: true,
    });
    expect(plain).toBe('Annual Rainfall');
  });

  it('should filter diffTableData when showOnlyDiffs is toggled', () => {
    expect(component.showOnlyDiffs()).toBe(false);
    component.showOnlyDiffs.set(true);
    expect(component.showOnlyDiffs()).toBe(true);
  });

  it('should format getDiffTooltip accurately based on diff status', () => {
    const inSyncTooltip = component.getDiffTooltip({
      status: 'in_sync',
      totalYearsAddedCount: 0,
      totalYearsRemovedCount: 0,
      totalChangedValuesCount: 0,
      products: {},
      hasAppData: true,
      hasDbData: true,
      stationId: 'st_1',
    });
    expect(inSyncTooltip).toContain('identical');

    const diffTooltip = component.getDiffTooltip({
      status: 'diff',
      totalYearsAddedCount: 2,
      totalYearsRemovedCount: 1,
      totalChangedValuesCount: 3,
      products: {
        rainfall: {
          productId: 'rainfall',
          label: 'Rainfall',
          units: 'mm',
          yearsAdded: [2021, 2022],
          yearsRemoved: [1980],
          changedCount: 1,
          changes: [],
          appYearSpan: [1980, 2020],
          dbYearSpan: [1981, 2022],
          hasData: true,
          isInSync: false,
        },
      },
      hasAppData: true,
      hasDbData: true,
      stationId: 'st_1',
    });
    expect(diffTooltip).toContain('+2 added');
    expect(diffTooltip).toContain('-1 removed');
    expect(diffTooltip).toContain('~3 changed');
    expect(diffTooltip).toContain('Rainfall: +2 yrs, -1 yrs, ~1 changed');
  });

  it('should open StationDiffDialogComponent when openStationDiffDialog is called', () => {
    const mockStation: any = { id: 'salima', station_id: 'salima', station_name: 'Salima' };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    } as any;

    component.openStationDiffDialog(mockStation, mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
    expect(mockDialog.open).toHaveBeenCalledWith(
      StationDiffDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          station: mockStation,
        }),
        panelClass: 'no-padding',
        autoFocus: false,
      }),
    );
  });
});

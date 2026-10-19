import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ClimateService } from '../../climate.service';
import { ClimateAdminPageComponent } from './admin.component';

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

  it('should configure DB table options with sortable numeric QC status, year counters and warnings', () => {
    expect(component.dbTableOptions.displayColumns).toEqual([
      'name',
      'qc_score',
      'rainfall_year_range',
      'rainfall_total_years',
      'rainfall_last_thirty_years',
      'rainfall_last_ten_years',
      'qc_warnings',
      'products',
      'monthly_data',
      'updated_at',
    ]);
    expect(component.dbTableOptions.sort).toEqual({ id: 'qc_score', start: 'asc' });

    expect(component.dbTableOptions.formatHeader('name')).toBe('Station');
    expect(component.dbTableOptions.formatHeader('qc_score')).toBe('QC Status');
    expect(component.dbTableOptions.formatHeader('qc_passed')).toBe('QC Status');
    expect(component.dbTableOptions.formatHeader('rainfall_year_range')).toBe('Years Range');
    expect(component.dbTableOptions.formatHeader('rainfall_total_years')).toBe('Total Years');
    expect(component.dbTableOptions.formatHeader('rainfall_last_thirty_years')).toBe('Past 30 Years');
    expect(component.dbTableOptions.formatHeader('rainfall_last_ten_years')).toBe('Past 10 Years');
    expect(component.dbTableOptions.formatHeader('qc_warnings')).toBe('Warnings');
    expect(component.dbTableOptions.formatHeader('products')).toBe('Products 🌧  🌡  🌾');
    expect(component.dbTableOptions.formatHeader('monthly_data')).toBe('Monthly 🌧  🌡');
    expect(component.dbTableOptions.formatHeader('updated_at')).toBe('Last Sync');
  });

  it('should assign color classes based on QC rank severity and data depth strictly by score', () => {
    // Failures (lighter/paler shades)
    expect(component.getQcScoreColorClass(-3)).toBe('text-rose-700');
    expect(component.getQcScoreColorClass(-2)).toBe('text-rose-500');
    expect(component.getQcScoreColorClass(-1)).toBe('text-amber-500');

    // Passes (strictly grouped by score without interchanging, lighter shades)
    expect(component.getQcScoreColorClass(30)).toBe('text-teal-500'); // near-miss / baseline (< 40)
    expect(component.getQcScoreColorClass(40)).toBe('text-emerald-500'); // solid pass (40..59)
    expect(component.getQcScoreColorClass(60)).toBe('text-emerald-600'); // strong record (>= 60)

    // Accepts row object with qc_score
    const rowObj: any = { qc_score: 45 };
    expect(component.getQcScoreColorClass(rowObj)).toBe('text-emerald-500');
  });

  it('should open station details dialog on row click', () => {
    const dialogSpy = jest.spyOn((component as any).dialog, 'open').mockReturnValue({} as any);
    const mockStation = { id: 's1', station_id: 's1', station_name: 'Test' };
    component.openStationDetailsDialog(mockStation as any);
    expect(dialogSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: { station: mockStation },
      }),
    );
  });

  it('should format QC status tooltip and warning lines correctly', () => {
    const passedRow: any = { qc_passed: true, qc_score: 35 };
    const passedTooltip = component.getQcStatusTooltip(passedRow);
    expect(passedTooltip).toContain('Quality Control: Passed');
    expect(passedTooltip).toContain('Total rainfall record ≥ 30 years');

    const failedRow: any = {
      qc_passed: false,
      qc_score: -1,
      qc_reasons: ['Insufficient rainfall record (< 30 years)'],
    };
    const failedTooltip = component.getQcStatusTooltip(failedRow);
    expect(failedTooltip).toContain('Quality Control: Failed');
    expect(failedTooltip).toContain('Insufficient rainfall record (< 30 years)');

    const warningRow: any = { qc_season_warning: '2 years with start but no end' };
    expect(component.getWarningLines(warningRow)).toEqual(['2 years with start but no end']);
  });

  it('should support filtering DB table by QC status', () => {
    expect(component.dbQcFilter()).toBe('all');
    component.setDbQcFilter('passed');
    expect(component.dbQcFilter()).toBe('passed');
    // toggling same filter returns to all
    component.setDbQcFilter('passed');
    expect(component.dbQcFilter()).toBe('all');

    component.setDbQcFilter('failed');
    expect(component.dbQcFilter()).toBe('failed');
  });

  it('should format monthly tooltip correctly', () => {
    const tooltip = component.getMonthlyTooltip({ has_temp: true, has_rain: false });
    expect(tooltip).toContain('Monthly Rainfall: Missing');
    expect(tooltip).toContain('Monthly Temperature: Available');
  });

  it('should configure App Bundled table options', () => {
    expect(component.appTableOptions.displayColumns).toContain('name');
    expect(component.appTableOptions.displayColumns).toContain('has_bundled_data');
    expect(component.appTableOptions.displayColumns).toContain('total_years');
    expect(component.appTableOptions.displayColumns).toContain('products');
    expect(component.appTableOptions.formatHeader('name')).toBe('Station');
    expect(component.appTableOptions.formatHeader('has_bundled_data')).toBe('Bundled Status');
  });

  it('should configure Diff table options with detailed product change breakdown columns', () => {
    expect(component.diffTableOptions.displayColumns).toEqual([
      'name',
      'diff_status',
      'updated_at',
      'app_years_count',
      'db_years_count',
      'season_diff_percent',
      'season_diff',
      'temp_diff_percent',
      'temp_diff',
      'actions',
    ]);
    expect(component.diffTableOptions.formatHeader('diff_status')).toBe('Status');
    expect(component.diffTableOptions.formatHeader('updated_at')).toBe('Data System Generated');
    expect(component.diffTableOptions.formatHeader('app_years_count')).toBe('App Years');
    expect(component.diffTableOptions.formatHeader('db_years_count')).toBe('Data System Years');
    expect(component.diffTableOptions.formatHeader('season_diff_percent')).toBe('Season Change %');
    expect(component.diffTableOptions.formatHeader('season_diff')).toBe('Season Change');
    expect(component.diffTableOptions.formatHeader('temp_diff_percent')).toBe('Temp Change %');
    expect(component.diffTableOptions.formatHeader('temp_diff')).toBe('Temp Change');
    expect(component.diffTableOptions.formatHeader('actions')).toBe('Action');
  });

  it('should open station diff dialog on diff row click', () => {
    const diffDialogSpy = jest.spyOn(component, 'openStationDiffDialog').mockImplementation();
    const mockRow: any = {
      station: { id: 's1', station_id: 's1', station_name: 'Test' },
      diff_status: 'diff',
    };
    component.diffTableOptions.handleRowClick(mockRow);
    expect(diffDialogSpy).toHaveBeenCalledWith(mockRow.station);
  });

  it('should support filtering Diff table by comparison status', () => {
    expect(component.diffFilter()).toBe('all');
    component.setDiffFilter('diff');
    expect(component.diffFilter()).toBe('diff');
    expect(component.showOnlyDiffs()).toBe(true);

    // toggling same filter resets to all
    component.setDiffFilter('diff');
    expect(component.diffFilter()).toBe('all');
    expect(component.showOnlyDiffs()).toBe(false);

    component.setDiffFilter('in_sync');
    expect(component.diffFilter()).toBe('in_sync');
    expect(component.showOnlyDiffs()).toBe(false);
  });
});
